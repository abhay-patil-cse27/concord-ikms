import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_platform_admin_accesses_user_list(client: AsyncClient):
    # Login as admin
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    token = login_res.json()["access_token"]

    response = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 4


@pytest.mark.asyncio
async def test_student_rejected_from_user_list(client: AsyncClient):
    # Login as student
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    token = login_res.json()["access_token"]

    # Student lacks 'users:read'
    response = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "PERMISSION_DENIED"
    assert "users:read" in data["error"]["message"]
    assert "request_id" in data


@pytest.mark.asyncio
async def test_faculty_rejected_from_audit_logs(client: AsyncClient):
    # Login as faculty
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "faculty"})
    token = login_res.json()["access_token"]

    # Faculty lacks 'audit:read'
    response = await client.get("/api/v1/audit/events", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "PERMISSION_DENIED"
    assert "audit:read" in data["error"]["message"]


@pytest.mark.asyncio
async def test_platform_admin_accesses_audit_logs(client: AsyncClient):
    # Login as admin
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    token = login_res.json()["access_token"]

    response = await client.get("/api/v1/audit/events", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    events = response.json()
    assert isinstance(events, list)


@pytest.mark.asyncio
async def test_department_list_access(client: AsyncClient):
    # Student has 'departments:read'
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    token = login_res.json()["access_token"]

    response = await client.get("/api/v1/organizations/departments", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    departments = response.json()
    assert isinstance(departments, list)
    dept_codes = [d["code"] for d in departments]
    assert "CSE" in dept_codes
    assert "ADMIN" in dept_codes
