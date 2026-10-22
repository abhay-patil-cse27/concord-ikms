"""Integration tests for Milestone 8 Canonical Seed Data and Multi-Department Retrieval."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_multi_department_demo_documents_retrieval(client: AsyncClient):
    """Verify that seeded multi-department documents are retrievable via hybrid search."""
    # Authenticate as Platform Admin via demo-login
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Search for 2024 academic passing criteria
    res = await client.post(
        "/api/v1/search/query",
        json={"query": "passing criteria in end semester examination", "top_k": 3},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) > 0
    filenames = [r["document_filename"] for r in data["results"]]
    assert any("KIT_Autonomous_Academic_Regulations_2024.pdf" in f for f in filenames)

    # 2. Search for CSE curriculum
    res_cse = await client.post(
        "/api/v1/search/query",
        json={"query": "CS301 Advanced Data Structures algorithms credits", "top_k": 3},
        headers=headers
    )
    assert res_cse.status_code == 200
    cse_data = res_cse.json()
    assert len(cse_data["results"]) > 0
    assert "BTech_CSE_Autonomous_Curriculum_2024_28.pdf" in cse_data["results"][0]["document_filename"]


@pytest.mark.asyncio
async def test_superseded_policy_search_exclusion(client: AsyncClient):
    """Verify that superseded 2020 regulations are excluded by default unless requested."""
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Default query should retrieve 2024 active regulation, NOT superseded 2020
    res = await client.post(
        "/api/v1/search/query",
        json={"query": "minimum attendance percentage requirement", "top_k": 5},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    filenames = [r["document_filename"] for r in data["results"]]
    assert "KIT_Autonomous_Academic_Regulations_2024.pdf" in filenames
    # Superseded document should be absent in active search
    assert "KIT_Academic_Regulations_2020_Superseded.pdf" not in filenames
