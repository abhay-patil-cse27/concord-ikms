"""Automated tests for Milestone 3: Hybrid Search, RRF, and RBAC Scoping."""
import pytest
from httpx import AsyncClient
from app.modules.retrieval.embeddings import DeterministicHashEmbeddingProvider
from app.modules.retrieval.fusion import (
    compute_cosine_similarity,
    compute_lexical_score,
    reciprocal_rank_fusion
)


def test_hash_embedding_deterministic_and_normalized():
    provider = DeterministicHashEmbeddingProvider(dimension=128)
    vec1 = provider.embed_text("Examination policy for academic semester 2026")
    vec2 = provider.embed_text("Examination policy for academic semester 2026")
    vec_different = provider.embed_text("Hostel room allocation and mess fees")

    assert len(vec1) == 128
    assert vec1 == vec2  # Exactly deterministic

    sim_identical = compute_cosine_similarity(vec1, vec2)
    sim_different = compute_cosine_similarity(vec1, vec_different)

    assert sim_identical > 0.99
    assert sim_different < sim_identical


def test_lexical_scoring_exact_phrase_bonus():
    query = "academic calendar"
    text_exact = "The official academic calendar for 2026 has been published."
    text_unrelated = "Bus schedules for campus transit."

    score_match = compute_lexical_score(query, text_exact)
    score_unrelated = compute_lexical_score(query, text_unrelated)

    assert score_match > 3.0  # Includes phrase bonus
    assert score_unrelated == 0.0


def test_reciprocal_rank_fusion_logic():
    lex_candidates = [
        {"chunk_id": "chunk-1", "title": "Doc 1"},
        {"chunk_id": "chunk-2", "title": "Doc 2"},
    ]
    vec_candidates = [
        {"chunk_id": "chunk-2", "title": "Doc 2"},
        {"chunk_id": "chunk-3", "title": "Doc 3"},
    ]

    # chunk-2 appears in both lists, so its combined RRF score should rank highest
    fused = reciprocal_rank_fusion(lex_candidates, vec_candidates, k=60, top_n=5)

    assert len(fused) == 3
    assert fused[0]["chunk_id"] == "chunk-2"
    assert fused[0]["rank"] == 1


@pytest.mark.asyncio
async def test_search_api_endpoint(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = login_res.json()["access_token"]

    response = await client.post(
        "/api/v1/search/query",
        json={"query": "syllabus", "top_k": 5, "mode": "hybrid"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "latency_ms" in data
    assert data["retrieval_mode"] == "hybrid"


@pytest.mark.asyncio
async def test_search_unauthorized_rejection(client: AsyncClient):
    response = await client.post(
        "/api/v1/search/query",
        json={"query": "syllabus"}
    )
    assert response.status_code == 401


def test_academic_query_normalizer():
    from app.modules.retrieval.normalizer import AcademicQueryNormalizer
    
    # Test typo correction
    norm, expanded = AcademicQueryNormalizer.normalize("summaries syallbus of devpos")
    assert "summarize" in norm
    assert "syllabus" in norm
    assert "devops" in norm

    # Test acronym expansion
    norm_bda, expanded_bda = AcademicQueryNormalizer.normalize("explain bda course outcomes")
    assert "big data analytics" in expanded_bda
    assert "bda" in norm_bda


def test_flashrank_cross_encoder_reranking():
    from app.modules.retrieval.reranker import get_reranker
    reranker = get_reranker()

    candidates = [
        {"chunk_id": "c1", "content": "The weather today in Paris is sunny.", "score": 0.9},
        {"chunk_id": "c2", "content": "DevOps laboratory covers Docker containers and CI/CD pipelines.", "score": 0.4}
    ]

    # Query specifically about Docker/DevOps
    reranked = reranker.rerank("Docker container deployment", candidates, top_k=2)
    assert len(reranked) == 2
    # The relevant DevOps document chunk must be elevated to Rank 1 over the weather text
    assert reranked[0]["chunk_id"] == "c2"

