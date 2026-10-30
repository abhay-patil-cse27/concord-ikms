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
