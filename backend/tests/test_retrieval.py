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


def test_fuzzy_typing_and_relevance_gate():
    from app.modules.retrieval.normalizer import AcademicQueryNormalizer
    from app.modules.retrieval.rag_service import RAGService

    # 1. Multi-word phrase typo: "bid data" -> "big data"
    norm, exp, corrections = AcademicQueryNormalizer.normalize_with_metadata("summarise bid data course?")
    assert "big data" in norm
    assert "bid data" in corrections
    assert corrections["bid data"] == "big data"

    # 2. Fuzzy Levenshtein edit distance: "atendance criteria"
    norm2, exp2, corr2 = AcademicQueryNormalizer.normalize_with_metadata("what is the atendance criteria?")
    assert "attendance" in norm2

    # 3. Relevance Gating: Valid vs Unrelated chunks
    valid_chunk = {
        "chunk_id": "c1",
        "content": "Title of Course: Big Data Analytics (UCSPC0701). Hadoop and Spark ecosystem.",
        "score": 0.88
    }
    assert RAGService.is_chunk_relevant(valid_chunk, "summarize big data course") is True

    irrelevant_chunk = {
        "chunk_id": "c2",
        "content": "Title of Course: Financial Analytics (UCSMM0741). Portfolio management.",
        "score": 0.0036
    }
    assert RAGService.is_chunk_relevant(irrelevant_chunk, "summarize big data course") is False

    zero_score_chunk = {
        "chunk_id": "c3",
        "content": "Campus hostel mess timing and dinner schedule.",
        "score": 0.0
    }
    assert RAGService.is_chunk_relevant(zero_score_chunk, "summarize big data course") is False


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


@pytest.mark.asyncio
async def test_search_lifecycle_filtering(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    # 1. Upload an active doc
    files_active = {"file": ("attendance_policy_2026.txt", b"Mandatory 75% attendance for exam eligibility.", "text/plain")}
    data_active = {"department_id": user_dept_id, "title": "Attendance Policy 2026"}
    res_active = await client.post("/api/v1/documents/upload", files=files_active, data=data_active, headers={"Authorization": f"Bearer {admin_token}"})
    doc_id_active = res_active.json()["document"]["id"]

    # 2. Upload an older doc and mark as superseded
    files_old = {"file": ("attendance_policy_2022.txt", b"Mandatory 60% attendance for exam eligibility.", "text/plain")}
    data_old = {"department_id": user_dept_id, "title": "Attendance Policy 2022"}
    res_old = await client.post("/api/v1/documents/upload", files=files_old, data=data_old, headers={"Authorization": f"Bearer {admin_token}"})
    doc_id_old = res_old.json()["document"]["id"]
    await client.patch(
        f"/api/v1/documents/{doc_id_old}/lifecycle",
        json={"lifecycle_status": "superseded", "version": "v2022.0"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # 3. Search with default lifecycle_status="active" -> only active document returned
    search_active = await client.post(
        "/api/v1/search/query",
        json={"query": "attendance percentage", "lifecycle_status": "active"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert search_active.status_code == 200
    results_active = search_active.json()["results"]
    doc_ids_active = [r["document_id"] for r in results_active]
    assert doc_id_active in doc_ids_active
    assert doc_id_old not in doc_ids_active  # Superseded doc must be excluded

    # 4. Search with lifecycle_status="all" -> both returned
    search_all = await client.post(
        "/api/v1/search/query",
        json={"query": "attendance percentage", "lifecycle_status": "all"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert search_all.status_code == 200
    doc_ids_all = [r["document_id"] for r in search_all.json()["results"]]
    assert doc_id_old in doc_ids_all

    # Cleanup
    await client.delete(f"/api/v1/documents/{doc_id_active}", headers={"Authorization": f"Bearer {admin_token}"})
    await client.delete(f"/api/v1/documents/{doc_id_old}", headers={"Authorization": f"Bearer {admin_token}"})


