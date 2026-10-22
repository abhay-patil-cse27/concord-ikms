import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_document_upload_and_chunking_lifecycle(client: AsyncClient):
    # 1. Login as faculty member (has 'documents:write' permission)
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "faculty"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    # 2. Upload text document
    sample_content = (
        "CONCORD Institutional Handbook 2026.\n\n"
        "Chapter 1: Academic Integrity and Code of Conduct.\n"
        "All research and academic activities must adhere strictly to ethical guidelines.\n\n"
        "Chapter 2: Examination Framework.\n"
        "Continuous internal assessment comprises 40% weightage, and end semester exams comprise 60%."
    )
    files = {
        "file": ("handbook.txt", sample_content.encode("utf-8"), "text/plain"),
    }
    data = {
        "department_id": user_dept_id,
        "title": "Institutional Handbook 2026",
    }

    upload_res = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()["document"]
    assert doc_data["title"] == "Institutional Handbook 2026"
    assert doc_data["status"] == "processed"
    assert doc_data["chunk_count"] >= 1
    doc_id = doc_data["id"]

    # 3. List documents
    list_res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == 200
    docs = list_res.json()
    assert any(d["id"] == doc_id for d in docs)

    # 4. Inspect document details and chunks
    detail_res = await client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["chunks"]) >= 1
    assert "Academic Integrity" in detail["chunks"][0]["content"]

    # 5. Download document
    down_res = await client.get(f"/api/v1/documents/{doc_id}/download", headers={"Authorization": f"Bearer {token}"})
    assert down_res.status_code == 200
    assert "CONCORD Institutional Handbook" in down_res.text


@pytest.mark.asyncio
async def test_duplicate_document_rejection(client: AsyncClient):
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "faculty"})
    token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    file_payload = b"Unique content for duplicate detection test 12345."
    files = {"file": ("policy.txt", file_payload, "text/plain")}
    data = {"department_id": user_dept_id, "title": "Unique Policy"}

    # First upload succeeds
    res1 = await client.post("/api/v1/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 201

    # Second upload with identical content in same department must fail (Conflict 409)
    files2 = {"file": ("policy_duplicate.txt", file_payload, "text/plain")}
    res2 = await client.post("/api/v1/documents/upload", files=files2, data=data, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_student_cannot_upload_or_delete_documents(client: AsyncClient):
    # Student has documents:read, but lacks documents:write and documents:delete
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    files = {"file": ("unauthorized.txt", b"Student upload test", "text/plain")}
    data = {"department_id": user_dept_id, "title": "Unauthorized Test"}

    upload_res = await client.post("/api/v1/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert upload_res.status_code == 403
    assert upload_res.json()["error"]["code"] == "PERMISSION_DENIED"
