"""Automated tests for Option C: Real-Time Institutional Broadcast Hub & System Event Stream."""
import json
import pytest
import asyncio
from httpx import AsyncClient
from app.core.broadcast import broadcast_hub, BroadcastHub


@pytest.mark.asyncio
async def test_broadcast_hub_isolated_pubsub():
    """Validates the asynchronous pub/sub broker mechanics with multiple subscribers."""
    hub = BroadcastHub(max_queue_size=10)
    assert hub.subscriber_count == 0

    # 1. Register subscribers
    q1 = hub.subscribe()
    q2 = hub.subscribe()
    assert hub.subscriber_count == 2

    # 2. Publish message
    data = {"engine": "ollama", "status": "active"}
    deliveries = await hub.publish("test_event", data)
    assert deliveries == 2

    # 3. Verify queued SSE payloads
    msg1 = await q1.get()
    msg2 = await q2.get()
    assert "event: test_event" in msg1
    assert '"engine": "ollama"' in msg1
    assert msg1 == msg2

    # 4. Unsubscribe
    hub.unsubscribe(q1)
    assert hub.subscriber_count == 1
    hub.unsubscribe(q2)
    assert hub.subscriber_count == 0


@pytest.mark.asyncio
async def test_llm_toggle_triggers_live_broadcast(client: AsyncClient):
    """
    Verifies that hot-swapping LLM engine via PUT /system/llm-config
    automatically broadcasts the 'llm_engine_switched' event to active subscribers.
    """
    # 1. Login as Platform Admin
    admin_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    assert admin_login.status_code == 200
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Subscribe a mock client to the global broadcast hub
    client_queue = broadcast_hub.subscribe()
    try:
        # 3. Hot-swap LLM configuration to local mode
        update_res = await client.put(
            "/api/v1/system/llm-config",
            headers=headers,
            json={"provider_mode": "local", "local_url": "http://127.0.0.1:11434", "local_model": "deepseek-r1:1.5b"}
        )
        assert update_res.status_code == 200

        # 4. Verify subscriber receives the live event
        event_str = await asyncio.wait_for(client_queue.get(), timeout=2.0)
        assert "event: llm_engine_switched" in event_str
        assert "Local Campus Node (Ollama)" in event_str or "local" in event_str

        # 5. Clean up: reset back to cloud mode
        reset_res = await client.put(
            "/api/v1/system/llm-config",
            headers=headers,
            json={"provider_mode": "cloud"}
        )
        assert reset_res.status_code == 200
        reset_event = await asyncio.wait_for(client_queue.get(), timeout=2.0)
        assert "Groq Cloud API" in reset_event or "cloud" in reset_event
    finally:
        broadcast_hub.unsubscribe(client_queue)


@pytest.mark.asyncio
async def test_admin_custom_system_broadcast(client: AsyncClient):
    """
    Verifies that Platform Admins can push institutional bulletins via POST /system/broadcast.
    """
    admin_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client_queue = broadcast_hub.subscribe()
    try:
        payload = {
            "event_type": "system_maintenance",
            "title": "Scheduled Index Optimization",
            "message": "Autonomous regulation vectors will re-index at midnight.",
            "severity": "warning"
        }
        res = await client.post("/api/v1/system/broadcast", headers=headers, json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["event_type"] == "system_maintenance"

        # Verify broadcast delivery in queue
        event_str = await asyncio.wait_for(client_queue.get(), timeout=2.0)
        assert "event: system_maintenance" in event_str
        assert "Scheduled Index Optimization" in event_str
    finally:
        broadcast_hub.unsubscribe(client_queue)

