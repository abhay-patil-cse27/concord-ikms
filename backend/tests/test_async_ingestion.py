"""Tests for asynchronous document ingestion and job progress tracking."""
import pytest
import io
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_async_document_upload_and_job_polling(client: AsyncClient):
    # Authenticate as platform_admin
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch departments
    dept_res = await client.get("/api/v1/organizations/departments", headers=headers)
    assert dept_res.status_code == 200
    depts = dept_res.json()
    assert len(depts) > 0
    dept_id = depts[0]["id"]

    # Prepare dummy document
    dummy_text = "CONCORD Asynchronous Ingestion Test Document.\nSection 1: Real-time progress updates are verified."
    files = {
        "file": ("async_test_spec.txt", dummy_text.encode("utf-8"), "text/plain"),
    }
    data = {
        "department_id": dept_id,
        "title": "Async Ingestion Progress Test",
    }

    # Submit asynchronous ingestion job
    upload_res = await client.post(
        "/api/v1/documents/upload-async",
        files=files,
        data=data,
        headers=headers,
    )
    assert upload_res.status_code == 202
    job_payload = upload_res.json()
    assert "job_id" in job_payload
    job_id = job_payload["job_id"]
    assert job_payload["status"] == "pending"

    # Poll job status until complete (or max 10 seconds)
    completed = False
    for _ in range(20):
        await asyncio.sleep(0.5)
        status_res = await client.get(f"/api/v1/documents/jobs/{job_id}", headers=headers)
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["job_id"] == job_id
        if status_data["status"] == "completed":
            assert status_data["progress"] == 100
            assert status_data["phase"] == "done"
            assert "document" in status_data["result"]
            completed = True
            break
        elif status_data["status"] == "failed":
            pytest.fail(f"Ingestion job failed: {status_data.get('error')}")

    assert completed is True, f"Ingestion job {job_id} did not finish within timeout."
