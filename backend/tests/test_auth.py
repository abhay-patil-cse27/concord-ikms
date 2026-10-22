import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_demo_login_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/demo-login", json={"role_code": "student"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student.cse@concord.kit.edu"
    assert any(r["code"] == "student" for r in data["user"]["roles"])


@pytest.mark.asyncio
async def test_demo_login_invalid_role(client: AsyncClient):
    response = await client.post("/api/v1/auth/demo-login", json={"role_code": "non_existent_role"})
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_standard_password_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@concord.kit.edu", "password": "Admin@12345"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@concord.kit.edu"


@pytest.mark.asyncio
async def test_standard_password_login_failure(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@concord.kit.edu", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "request_id" in data


@pytest.mark.asyncio
async def test_get_me_profile_authenticated(client: AsyncClient):
    # Login as faculty
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "faculty"})
    token = login_res.json()["access_token"]

    # Request /auth/me
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "faculty.cse@concord.kit.edu"
    assert any(r["code"] == "faculty" for r in data["roles"])


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
