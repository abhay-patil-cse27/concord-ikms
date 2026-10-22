import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthz_liveness(client: AsyncClient):
    response = await client.get("/api/v1/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data


@pytest.mark.asyncio
async def test_readyz_readiness(client: AsyncClient):
    response = await client.get("/api/v1/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["checks"]["database"]["status"] == "connected"
    assert "latency_ms" in data["checks"]["database"]


@pytest.mark.asyncio
async def test_root_metadata(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "docs_url" in data
