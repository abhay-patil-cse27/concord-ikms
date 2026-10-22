"""Automated tests for CONCORD Evaluation & Benchmarking Engine."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_benchmark_metrics(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    token = login_res.json()["access_token"]

    res = await client.get("/api/v1/evaluation/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "modes" in data
    assert "hybrid" in data["modes"]
    assert "security_leakage_rate_pct" in data
    assert data["security_leakage_rate_pct"] == 0.0


@pytest.mark.asyncio
async def test_run_live_benchmark(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    token = login_res.json()["access_token"]

    res = await client.post("/api/v1/evaluation/run", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "concord_accuracy_gain_pct" in data
    assert data["optimal_mode"] == "hybrid"
