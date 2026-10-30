"""Automated tests for Milestone 11: Dual-Mode LLM Engine (Cloud vs Local/Remote Node)."""
import pytest
from httpx import AsyncClient
from app.modules.retrieval.llm_providers import (
    LocalLLMProvider,
    GroqCloudLLMProvider,
    OfflineFallbackLLMProvider,
    get_llm_provider,
    set_runtime_llm_config,
    get_runtime_llm_config,
    _build_evidence_context,
    _build_chat_payload,
    _clean_llm_response
)


def test_shared_helpers_modular_reusability():
    """Validates that extracted shared helpers produce expected structures without duplication."""
    evidence = [
        {
            "chunk_id": "c-101",
            "document_id": "d-101",
            "document_title": "Exam Ordinances 2026",
            "page_number": 3,
            "content": "Minimum attendance is 75 percent to be eligible for end semester exam.",
            "lifecycle_status": "active",
            "version": "v1.0"
        }
    ]
    text, citations = _build_evidence_context(evidence)
    assert "[Evidence 1]" in text
    assert "Exam Ordinances 2026" in text
    assert len(citations) == 1
    assert citations[0]["citation_index"] == 1
    assert citations[0]["chunk_id"] == "c-101"

    # Test payload construction
    payload = _build_chat_payload(
        model="qwen2.5:1.5b",
        system_prompt="System Prompt Test",
        user_content="User Question",
        temperature=0.05,
        stream=True
    )
    assert payload["model"] == "qwen2.5:1.5b"
    assert payload["temperature"] == 0.05
    assert payload["stream"] is True
    assert len(payload["messages"]) == 2

    # Test citation and response cleaning
    dirty = "According to rules 【1】 and [Evidence 2], attendance must be met.<br/>Thank you."
    cleaned = _clean_llm_response(dirty)
    assert "【1】" not in cleaned
    assert "[1]" in cleaned
    assert "[Evidence 2]" not in cleaned
    assert "[2]" in cleaned
    assert "<br/>" not in cleaned


@pytest.mark.asyncio
async def test_local_llm_provider_offline_resilience():
    """Verifies LocalLLMProvider gracefully falls back to synthesizer when node is offline."""
    # Point to a guaranteed non-existent local port to test resilience
    provider = LocalLLMProvider(
        base_url="http://127.0.0.1:59999",
        model="qwen2.5:1.5b",
        timeout=1.0
    )
    evidence = [
        {
            "chunk_id": "c-99",
            "document_id": "d-99",
            "document_title": "Curriculum Handbook",
            "page_number": 1,
            "content": "Computer Science engineering includes Cloud and Distributed Systems.",
            "lifecycle_status": "active",
            "version": "v1.0"
        }
    ]
    # Grounded answer with unreachable node must NOT raise exception, must synthesize
    res = await provider.generate_grounded_answer(
        query="Tell me about CSE curriculum",
        evidence_chunks=evidence
    )
    assert res is not None
    assert "Curriculum Handbook" in res["answer"]
    assert len(res["citations"]) == 1
    assert res["model_used"] == "offline_synthesizer"

    # Conversational answer with unreachable node must fallback gracefully
    conv_res = await provider.generate_conversational_answer("Hello")
    assert conv_res is not None
    assert "CONCORD" in conv_res["answer"]


def test_dynamic_factory_hot_swap():
    """Validates runtime configuration hot-swapping between Cloud and Local."""
    # Reset to cloud
    set_runtime_llm_config(provider_mode="cloud")
    provider = get_llm_provider()
    assert isinstance(provider, GroqCloudLLMProvider)

    # Hot-swap to local
    set_runtime_llm_config(
        provider_mode="local",
        local_url="http://192.168.1.100:11434",
        local_model="qwen2.5:1.5b"
    )
    provider = get_llm_provider()
    assert isinstance(provider, LocalLLMProvider)
    assert provider.endpoint == "http://192.168.1.100:11434/v1/chat/completions"
    assert provider.model == "qwen2.5:1.5b"

    # Reset back to default cloud
    set_runtime_llm_config(provider_mode="cloud")
    assert isinstance(get_llm_provider(), GroqCloudLLMProvider)


@pytest.mark.asyncio
async def test_system_api_endpoints_rbac(client: AsyncClient):
    """Tests GET/PUT /api/v1/system/llm-config and POST /api/v1/system/llm-test endpoints."""
    # 1. Non-admin should be rejected (403)
    student_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    forbidden_res = await client.get("/api/v1/system/llm-config", headers=student_headers)
    assert forbidden_res.status_code == 403

    # 2. Platform admin can retrieve config
    admin_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    cfg_res = await client.get("/api/v1/system/llm-config", headers=admin_headers)
    assert cfg_res.status_code == 200
    assert cfg_res.json()["success"] is True
    assert "provider_mode" in cfg_res.json()["config"]

    # 3. Platform admin can update config
    update_res = await client.put(
        "/api/v1/system/llm-config",
        headers=admin_headers,
        json={
            "provider_mode": "local",
            "local_url": "http://127.0.0.1:11434",
            "local_model": "qwen2.5:1.5b"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["config"]["provider_mode"] == "local"

    # 4. Probe endpoint returns clean diagnostic object even on non-running node
    test_res = await client.post(
        "/api/v1/system/llm-test",
        headers=admin_headers,
        json={"node_url": "http://127.0.0.1:59998", "timeout_seconds": 1.0}
    )
    assert test_res.status_code == 200
    probe = test_res.json()
    assert probe["reachable"] is False
    assert "latency_ms" in probe
    assert "status_message" in probe

    # Clean up: switch back to cloud
    await client.put(
        "/api/v1/system/llm-config",
        headers=admin_headers,
        json={"provider_mode": "cloud"}
    )


@pytest.mark.asyncio
async def test_llm_status_accessible_to_all_authenticated_users(client: AsyncClient):
    """
    Verifies that GET /api/v1/system/llm-status is accessible to unprivileged roles (student, faculty)
    without revealing sensitive credentials, but requires authentication.
    """
    # 1. Unauthenticated request must return 401 Unauthorized
    unauth_res = await client.get("/api/v1/system/llm-status")
    assert unauth_res.status_code == 401

    # 2. Student user receives 200 OK with clean public summary
    student_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    assert student_login.status_code == 200
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    student_res = await client.get("/api/v1/system/llm-status", headers=student_headers)
    assert student_res.status_code == 200
    data = student_res.json()
    assert data["success"] is True
    assert "status" in data
    status_info = data["status"]
    assert "provider_mode" in status_info
    assert "active_model" in status_info
    assert "display_name" in status_info
    assert "is_local" in status_info
    # Ensure zero sensitive credential leaks
    assert "api_key" not in status_info
    assert "node_url" not in status_info
    assert "groq_api_key" not in status_info

    # 3. Faculty user also receives 200 OK
    faculty_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "faculty"})
    assert faculty_login.status_code == 200
    faculty_token = faculty_login.json()["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    faculty_res = await client.get("/api/v1/system/llm-status", headers=faculty_headers)
    assert faculty_res.status_code == 200
    assert faculty_res.json()["status"]["provider_mode"] == status_info["provider_mode"]


@pytest.mark.asyncio
async def test_llm_config_persistence_and_audit_logging(client: AsyncClient):
    """
    Verifies that when an Admin updates LLM engine config:
    1. It persists to disk (backend/data/llm_config.json).
    2. It updates runtime engine status dynamically for all users.
    3. An audit ledger event (SYSTEM_LLM_CONFIG_UPDATE) is recorded.
    """
    from pathlib import Path
    import json

    admin_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    student_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 1. Update config to local mode with custom model
    update_res = await client.put(
        "/api/v1/system/llm-config",
        headers=admin_headers,
        json={
            "provider_mode": "local",
            "local_url": "http://127.0.0.1:11434",
            "local_model": "qwen2.5:1.5b"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["config"]["provider_mode"] == "local"

    # 2. Verify disk persistence in backend/data/llm_config.json
    config_path = Path(__file__).resolve().parent.parent / "data" / "llm_config.json"
    assert config_path.exists(), "llm_config.json was not created on disk"
    persisted_data = json.loads(config_path.read_text(encoding="utf-8"))
    assert persisted_data.get("provider_mode") == "local"
    assert persisted_data.get("local_model") == "qwen2.5:1.5b"

    # 3. Verify student immediately observes the global switch
    student_status = await client.get("/api/v1/system/llm-status", headers=student_headers)
    assert student_status.status_code == 200
    status_payload = student_status.json()["status"]
    assert status_payload["provider_mode"] == "local"
    assert status_payload["is_local"] is True
    assert "qwen2.5:1.5b" in status_payload["display_name"]

    # 4. Verify audit ledger entry
    audit_res = await client.get("/api/v1/audit/events", headers=admin_headers)
    assert audit_res.status_code == 200
    events = audit_res.json()
    llm_audit_events = [
        e for e in events 
        if e.get("action") == "SYSTEM_LLM_CONFIG_UPDATE" or 
           (isinstance(e.get("action"), dict) and e.get("action").get("value") == "SYSTEM_LLM_CONFIG_UPDATE")
    ]
    assert len(llm_audit_events) > 0, "SYSTEM_LLM_CONFIG_UPDATE not recorded in audit ledger"
    latest_event = llm_audit_events[0]
    details = latest_event.get("details") or latest_event.get("event_metadata") or latest_event.get("metadata") or {}
    assert details.get("provider_mode") == "local"

    # 5. Clean up: reset back to cloud and verify persistence updates
    reset_res = await client.put(
        "/api/v1/system/llm-config",
        headers=admin_headers,
        json={"provider_mode": "cloud"}
    )
    assert reset_res.status_code == 200
    persisted_reset = json.loads(config_path.read_text(encoding="utf-8"))
    assert persisted_reset.get("provider_mode") == "cloud"

