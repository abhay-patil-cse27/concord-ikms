"""Automated tests for Milestone 4: Grounded RAG with Groq Cloud & Fallback."""
import pytest
from httpx import AsyncClient
from app.modules.retrieval.llm_providers import GroqCloudLLMProvider, OfflineFallbackLLMProvider


def test_offline_fallback_synthesizer():
    provider = OfflineFallbackLLMProvider()
    query = "What is the passing criteria for exams?"
    evidence = [
        {
            "chunk_id": "c-1",
            "document_id": "d-1",
            "document_title": "Academic Regulations 2026",
            "document_filename": "regulations.pdf",
            "page_number": 4,
            "content": "Students must achieve at least 40% aggregate in end semester examinations to pass.",
            "score": 0.033
        }
    ]
    citations = [
        {
            "citation_index": 1,
            "chunk_id": "c-1",
            "document_id": "d-1",
            "document_title": "Academic Regulations 2026",
            "document_filename": "regulations.pdf",
            "page_number": 4,
            "snippet": "Students must achieve at least 40%...",
            "score": 0.033
        }
    ]

    result = provider.synthesize(query, evidence, citations)
    assert "Academic Regulations 2026" in result["answer"]
    assert "[1]" in result["answer"]
    assert result["model_used"] == "offline_synthesizer"
    assert len(result["citations"]) == 1


@pytest.mark.asyncio
async def test_groq_empty_evidence_refusal():
    provider = GroqCloudLLMProvider()
    result = await provider.generate_grounded_answer(
        query="What is the admission cutoff?",
        evidence_chunks=[]
    )
    assert result["confidence"] == "insufficient_evidence"
    assert "No relevant institutional documents found" in result["answer"]
    assert len(result["citations"]) == 0


@pytest.mark.asyncio
async def test_rag_api_endpoint(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = login_res.json()["access_token"]

    response = await client.post(
        "/api/v1/rag/ask",
        json={"query": "What are the rules regarding campus attendance?", "top_k": 3},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data
    assert "model_used" in data
    assert "latency_ms" in data
    assert data["retrieval_mode"] == "hybrid_rrf"


@pytest.mark.asyncio
async def test_rag_unauthorized_rejection(client: AsyncClient):
    response = await client.post(
        "/api/v1/rag/ask",
        json={"query": "Can students apply for re-evaluation?"}
    )
    assert response.status_code == 401
