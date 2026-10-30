"""Automated tests for Milestone 12: Public User Onboarding & 2-Tier Approval Workflow."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_registration_workflow(client: AsyncClient):
    """
    Verifies that a student can self-register, account is marked pending_tier1,
    unapproved login is rejected, and HOD can approve the applicant.
    """
    # 1. Fetch departments to obtain CSE department ID
    dept_res = await client.get("/api/v1/auth/departments")
    assert dept_res.status_code == 200
    depts = dept_res.json()
    cse_dept = next((d for d in depts if d["code"] == "CSE"), None)
    assert cse_dept is not None, "CSE department must exist in seeded database"

    # 2. Register a new student
    student_payload = {
        "full_name": "Rohan Deshmukh",
        "email": "rohan.deshmukh@kitcoek.in",
        "password": "Password@123",
        "department_id": cse_dept["id"],
        "role_code": "student",
        "registration_number": "2024BTECS089"
    }
    reg_res = await client.post("/api/v1/auth/register", json=student_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["approval_status"] == "pending_tier1"
    new_user_id = reg_data["user_id"]

    # 3. Attempting login before approval must fail with 401 Unauthorized
    login_attempt = await client.post(
        "/api/v1/auth/login",
        json={"email": "rohan.deshmukh@kitcoek.in", "password": "Password@123"}
    )
    assert login_attempt.status_code == 401
    err_msg = login_attempt.json().get("error", {}).get("message", "") or login_attempt.json().get("detail", "")
    assert "pending approval" in err_msg.lower()

    # 4. HOD CSE logs in to review the queue
    hod_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "dept_admin"})
    assert hod_login.status_code == 200
    hod_token = hod_login.json()["access_token"]

    # 5. HOD lists pending registrations
    pending_res = await client.get(
        "/api/v1/governance/pending-users",
        headers={"Authorization": f"Bearer {hod_token}"}
    )
    assert pending_res.status_code == 200
    pending_users = pending_res.json()
    assert any(u["id"] == new_user_id for u in pending_users)

    # 6. HOD approves the student
    approve_res = await client.post(
        f"/api/v1/governance/users/{new_user_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {hod_token}"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "approved"
    assert approve_res.json()["is_active"] is True

    # 7. Now the student can successfully log in and receive a JWT token
    login_success = await client.post(
        "/api/v1/auth/login",
        json={"email": "rohan.deshmukh@kitcoek.in", "password": "Password@123"}
    )
    assert login_success.status_code == 200
    token_data = login_success.json()
    assert "access_token" in token_data
    assert token_data["user"]["approval_status"] == "approved"


@pytest.mark.asyncio
async def test_hod_cannot_approve_other_department_students(client: AsyncClient):
    """
    BOLA isolation test: HOD of CSE cannot approve an applicant registered for Mechanical Engineering.
    """
    dept_res = await client.get("/api/v1/auth/departments")
    depts = dept_res.json()
    me_dept = next((d for d in depts if d["code"] == "ME"), None)
    assert me_dept is not None

    # Register student in ME department
    me_student_payload = {
        "full_name": "Suresh Patil",
        "email": "suresh.me@kitcoek.in",
        "password": "Password@123",
        "department_id": me_dept["id"],
        "role_code": "student",
        "registration_number": "2024BTEME012"
    }
    reg_res = await client.post("/api/v1/auth/register", json=me_student_payload)
    assert reg_res.status_code == 201
    me_student_id = reg_res.json()["user_id"]

    # HOD CSE attempts to approve ME student
    hod_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "dept_admin"})
    hod_token = hod_login.json()["access_token"]

    cross_dept_approve = await client.post(
        f"/api/v1/governance/users/{me_student_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {hod_token}"}
    )
    # Must be rejected with 403 Forbidden
    assert cross_dept_approve.status_code == 403


@pytest.mark.asyncio
async def test_dept_admin_tier2_approval_workflow(client: AsyncClient):
    """
    Verifies Tier 2: A newly registered Department Admin gets pending_tier2 status,
    and only Platform Admin can approve them.
    """
    dept_res = await client.get("/api/v1/auth/departments")
    depts = dept_res.json()
    aiml_dept = next((d for d in depts if d["code"] == "AIML"), None)
    assert aiml_dept is not None

    # Register new HOD for AIML
    hod_payload = {
        "full_name": "Dr. V. Kadam (HOD AIML)",
        "email": "hod.aiml@kitcoek.in",
        "password": "Password@123",
        "department_id": aiml_dept["id"],
        "role_code": "dept_admin",
        "registration_number": "EMP-AIML-001"
    }
    reg_res = await client.post("/api/v1/auth/register", json=hod_payload)
    assert reg_res.status_code == 201
    assert reg_res.json()["approval_status"] == "pending_tier2"
    aiml_hod_id = reg_res.json()["user_id"]

    # CSE HOD attempts to approve AIML HOD -> 403 Forbidden (Tier 2 requires platform_admin)
    cse_hod = await client.post("/api/v1/auth/demo-login", json={"role_code": "dept_admin"})
    cse_token = cse_hod.json()["access_token"]

    unauthorized_tier2 = await client.post(
        f"/api/v1/governance/users/{aiml_hod_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {cse_token}"}
    )
    assert unauthorized_tier2.status_code == 403

    # Super Admin (Platform Admin) logs in and approves AIML HOD
    admin_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    admin_token = admin_login.json()["access_token"]

    admin_approve = await client.post(
        f"/api/v1/governance/users/{aiml_hod_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_approve.status_code == 200
    assert admin_approve.json()["approval_status"] == "approved"


@pytest.mark.asyncio
async def test_user_rejection_workflow(client: AsyncClient):
    """
    Verifies that when a registration is rejected with a reason,
    the user's login attempt returns 401 with the specific rejection reason.
    """
    dept_res = await client.get("/api/v1/auth/departments")
    depts = dept_res.json()
    cse_dept = next((d for d in depts if d["code"] == "CSE"), None)

    # Register applicant
    payload = {
        "full_name": "Rejected Candidate",
        "email": "invalid.student@kitcoek.in",
        "password": "Password@123",
        "department_id": cse_dept["id"],
        "role_code": "student",
        "registration_number": "PRN-INVALID-99"
    }
    reg_res = await client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user_id"]

    # HOD CSE rejects with reason
    hod_login = await client.post("/api/v1/auth/demo-login", json={"role_code": "dept_admin"})
    hod_token = hod_login.json()["access_token"]

    reject_res = await client.post(
        f"/api/v1/governance/users/{user_id}/review",
        json={"action": "reject", "reason": "Invalid PRN format provided"},
        headers={"Authorization": f"Bearer {hod_token}"}
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["approval_status"] == "rejected"
    assert reject_res.json()["is_active"] is False

    # Attempted login displays rejection reason
    login_attempt = await client.post(
        "/api/v1/auth/login",
        json={"email": "invalid.student@kitcoek.in", "password": "Password@123"}
    )
    assert login_attempt.status_code == 401
    err_msg = login_attempt.json().get("error", {}).get("message", "")
    assert "rejected" in err_msg.lower()
    assert "invalid prn format" in err_msg.lower()
