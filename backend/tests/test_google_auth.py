import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_google_auth_empty_token(client: AsyncClient):
    response = await client.post("/api/v1/auth/google", json={"credential": ""})
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert "missing" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_google_auth_existing_active_user(client: AsyncClient):
    # admin@concord.kit.edu is seeded and active
    mock_token = "mock-google-token:admin@concord.kit.edu:Platform Administrator:concord.kit.edu"
    response = await client.post("/api/v1/auth/google", json={"credential": mock_token})
    assert response.status_code == 200
    data = response.json()
    assert data["is_registered"] is True
    assert data["access_token"] is not None
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@concord.kit.edu"
    assert any(r["code"] == "platform_admin" for r in data["user"]["roles"])


@pytest.mark.asyncio
async def test_google_auth_unregistered_institutional_user(client: AsyncClient):
    # Non-existent @kitcoek.in institutional user
    mock_token = "mock-google-token:new.student@kitcoek.in:Jane Doe:kitcoek.in"
    response = await client.post("/api/v1/auth/google", json={"credential": mock_token})
    assert response.status_code == 200
    data = response.json()
    assert data["is_registered"] is False
    assert data["email"] == "new.student@kitcoek.in"
    assert data["full_name"] == "Jane Doe"
    assert data["hd"] == "kitcoek.in"
    assert data["access_token"] is None


@pytest.mark.asyncio
async def test_google_auth_unregistered_gmail_user(client: AsyncClient):
    # Non-existent personal @gmail.com user
    mock_token = "mock-google-token:external.applicant@gmail.com:John Smith:"
    response = await client.post("/api/v1/auth/google", json={"credential": mock_token})
    assert response.status_code == 200
    data = response.json()
    assert data["is_registered"] is False
    assert data["email"] == "external.applicant@gmail.com"
    assert data["full_name"] == "John Smith"
    assert data["access_token"] is None


@pytest.mark.asyncio
async def test_google_auth_pending_user_rejected(client: AsyncClient):
    # Fetch department id
    dept_res = await client.get("/api/v1/auth/departments")
    assert dept_res.status_code == 200
    depts = dept_res.json()
    dept_id = depts[0]["id"]

    # Register new user
    pending_email = "pending.oauth.user@kitcoek.in"
    reg_payload = {
        "full_name": "Pending OAuth Applicant",
        "email": pending_email,
        "password": "Password@123",
        "department_id": dept_id,
        "role_code": "student",
        "registration_number": "PRN-OAUTH-9999",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # Attempt Google Sign-In with this pending user's email
    mock_token = f"mock-google-token:{pending_email}:Pending OAuth Applicant:kitcoek.in"
    oauth_res = await client.post("/api/v1/auth/google", json={"credential": mock_token})
    assert oauth_res.status_code == 401
    err_data = oauth_res.json()
    assert "pending" in err_data["error"]["message"].lower()
