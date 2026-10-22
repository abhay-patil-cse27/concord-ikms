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


@pytest.mark.asyncio
async def test_document_lifecycle_version_update(client: AsyncClient):
    # Admin logs in and uploads document
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    content = b"Draft curriculum for autonomous batch 2026-27."
    files = {"file": ("curriculum_v1.txt", content, "text/plain")}
    data = {"department_id": user_dept_id, "title": "Curriculum 2026"}

    upload_res = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document"]["id"]
    assert upload_res.json()["document"]["lifecycle_status"] == "active"
    assert upload_res.json()["document"]["version"] == "v1.0"

    # Transition lifecycle to superseded
    patch_res = await client.patch(
        f"/api/v1/documents/{doc_id}/lifecycle",
        json={"lifecycle_status": "superseded", "version": "v1.0-deprecated"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert patch_res.status_code == 200
    updated_doc = patch_res.json()
    assert updated_doc["lifecycle_status"] == "superseded"
    assert updated_doc["version"] == "v1.0-deprecated"

    # Cleanup
    del_res = await client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_governance_approval_workflow(client: AsyncClient):
    # 1. Admin login
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = login_res.json()["access_token"]
    user_dept_id = login_res.json()["user"]["primary_department_id"]

    # 2. Upload document
    content = b"Proposed academic regulation pending committee review."
    files = {"file": ("proposed_reg.txt", content, "text/plain")}
    data = {"department_id": user_dept_id, "title": "Proposed Regulation"}

    upload_res = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document"]["id"]

    # 3. Transition to pending_approval via lifecycle endpoint
    await client.patch(
        f"/api/v1/documents/{doc_id}/lifecycle",
        json={"lifecycle_status": "draft"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # 4. Approve via governance endpoint
    approve_res = await client.post(
        f"/api/v1/governance/documents/{doc_id}/review",
        json={"decision": "approved", "notes": "Approved by HOD"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert approve_res.status_code == 200
    approved_doc = approve_res.json()
    assert approved_doc["approval_status"] == "approved"
    assert approved_doc["lifecycle_status"] == "active"
    assert approved_doc["approval_notes"] == "Approved by HOD"

    # Cleanup
    await client.delete(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {admin_token}"})


