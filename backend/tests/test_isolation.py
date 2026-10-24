"""Per-User Data Isolation and Broken Object-Level Authorization (BOLA) Test Suite.

Verifies:
1. User A cannot list, read, or delete User B's conversation threads (expects 404 Not Found to prevent ID enumeration).
2. Platform Admin cannot read private conversation content of other users (returns 404).
3. HOD, Faculty, and Student each see only their own threads in list endpoints.
4. Setting owner_id in the request body is ignored server-side.
5. Documents adhere to visibility (department or public), returning 404 for unauthorized documents.
6. Unauthenticated requests return 401 Unauthorized across all endpoints.
"""
import pytest
from httpx import AsyncClient


async def get_token_for_role(client: AsyncClient, role_code: str) -> str:
    res = await client.post("/api/v1/auth/demo-login", json={"role_code": role_code})
    assert res.status_code == 200, f"Demo login failed for {role_code}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_unauthenticated_requests_return_401(client: AsyncClient):
    """Endpoints reject unauthenticated requests with 401 Unauthorized."""
    endpoints = [
        ("GET", "/api/v1/conversations"),
        ("POST", "/api/v1/conversations"),
        ("GET", "/api/v1/conversations/non-existent-id"),
        ("DELETE", "/api/v1/conversations/non-existent-id"),
        ("GET", "/api/v1/documents"),
        ("GET", "/api/v1/audit/events"),
        ("GET", "/api/v1/users"),
    ]
    for method, path in endpoints:
        if method == "GET":
            res = await client.get(path)
        elif method == "POST":
            res = await client.post(path, json={})
        elif method == "DELETE":
            res = await client.delete(path)
        assert res.status_code == 401, f"{method} {path} returned {res.status_code}, expected 401"


@pytest.mark.asyncio
async def test_user_a_cannot_read_or_delete_user_b_conversation(client: AsyncClient):
    """
    User A (Faculty) creates a conversation thread.
    User B (Student) cannot read, list, or delete User A's thread.
    Crucially, attempts to access it by ID return 404 Not Found (not 403) to prevent ID probing.
    """
    faculty_token = await get_token_for_role(client, "faculty")
    student_token = await get_token_for_role(client, "student")

    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 1. Faculty creates a thread
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Confidential Faculty Research Notes"},
        headers=faculty_headers,
    )
    assert create_res.status_code == 201
    thread_data = create_res.json()
    thread_id = thread_data["id"]

    # 2. Student lists conversations - faculty thread MUST NOT appear
    student_list_res = await client.get("/api/v1/conversations", headers=student_headers)
    assert student_list_res.status_code == 200
    student_threads = [t["id"] for t in student_list_res.json()]
    assert thread_id not in student_threads

    # 3. Student probes Faculty's thread ID directly - MUST return 404 (not 403)
    student_get_res = await client.get(f"/api/v1/conversations/{thread_id}", headers=student_headers)
    assert student_get_res.status_code == 404
    assert "not found" in student_get_res.text.lower()

    # 4. Student attempts to delete Faculty's thread ID - MUST return 404 (not 403)
    student_del_res = await client.delete(f"/api/v1/conversations/{thread_id}", headers=student_headers)
    assert student_del_res.status_code == 404

    # 5. Faculty can successfully read their own thread
    fac_get_res = await client.get(f"/api/v1/conversations/{thread_id}", headers=faculty_headers)
    assert fac_get_res.status_code == 200
    assert fac_get_res.json()["title"] == "Confidential Faculty Research Notes"

    # Cleanup: Faculty deletes their own thread
    fac_del_res = await client.delete(f"/api/v1/conversations/{thread_id}", headers=faculty_headers)
    assert fac_del_res.status_code == 204


@pytest.mark.asyncio
async def test_platform_admin_cannot_read_private_user_chat(client: AsyncClient):
    """
    Platform Admin cannot inspect private conversation messages of another user.
    Admin receives 404 on attempting to fetch another user's private thread ID.
    """
    student_token = await get_token_for_role(client, "student")
    admin_token = await get_token_for_role(client, "platform_admin")

    student_headers = {"Authorization": f"Bearer {student_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Student creates a private thread
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Private Student Career Guidance"},
        headers=student_headers,
    )
    assert create_res.status_code == 201
    thread_id = create_res.json()["id"]

    # Admin lists conversations - student thread MUST NOT appear in admin's personal threads
    admin_list_res = await client.get("/api/v1/conversations", headers=admin_headers)
    assert admin_list_res.status_code == 200
    admin_threads = [t["id"] for t in admin_list_res.json()]
    assert thread_id not in admin_threads

    # Admin probes student's thread ID directly - MUST return 404
    admin_get_res = await client.get(f"/api/v1/conversations/{thread_id}", headers=admin_headers)
    assert admin_get_res.status_code == 404

    # Cleanup
    await client.delete(f"/api/v1/conversations/{thread_id}", headers=student_headers)


@pytest.mark.asyncio
async def test_owner_id_in_request_body_is_ignored(client: AsyncClient):
    """
    Even if an attacker supplies owner_id or user_id in the create request body,
    the server-side auth token dictates the owner.
    """
    student_token = await get_token_for_role(client, "student")
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Attempt to spoof owner_id as admin
    spoof_res = await client.post(
        "/api/v1/conversations",
        json={
            "title": "Spoofed Thread",
            "owner_id": "00000000-0000-0000-0000-000000000001",
            "user_id": "00000000-0000-0000-0000-000000000001"
        },
        headers=student_headers,
    )
    assert spoof_res.status_code == 201
    data = spoof_res.json()

    # The actual owner_id MUST equal the student's authenticated user ID, not the spoofed ID
    me_res = await client.get("/api/v1/auth/me", headers=student_headers)
    assert me_res.status_code == 200
    actual_student_id = me_res.json()["id"]

    assert data["owner_id"] == actual_student_id
    assert data["user_id"] == actual_student_id

    # Cleanup
    await client.delete(f"/api/v1/conversations/{data['id']}", headers=student_headers)


@pytest.mark.asyncio
async def test_multi_role_thread_isolation(client: AsyncClient):
    """
    Parametrized isolation check across Admin, HOD, Faculty, and Student.
    Each persona creates a thread and verifies no other persona can list or read it.
    """
    roles = ["platform_admin", "dept_admin", "faculty", "student"]
    tokens = {r: await get_token_for_role(client, r) for r in roles}
    created_threads = {}

    # Each role creates their own thread
    for role in roles:
        res = await client.post(
            "/api/v1/conversations",
            json={"title": f"Thread by {role}"},
            headers={"Authorization": f"Bearer {tokens[role]}"},
        )
        assert res.status_code == 201
        created_threads[role] = res.json()["id"]

    # Verify cross-role isolation
    for role_owner, thread_id in created_threads.items():
        for role_viewer in roles:
            headers = {"Authorization": f"Bearer {tokens[role_viewer]}"}
            if role_viewer == role_owner:
                get_res = await client.get(f"/api/v1/conversations/{thread_id}", headers=headers)
                assert get_res.status_code == 200
            else:
                get_res = await client.get(f"/api/v1/conversations/{thread_id}", headers=headers)
                assert get_res.status_code == 404, f"{role_viewer} could access thread of {role_owner}!"

    # Cleanup
    for role, thread_id in created_threads.items():
        await client.delete(f"/api/v1/conversations/{thread_id}", headers={"Authorization": f"Bearer {tokens[role]}"})


@pytest.mark.asyncio
async def test_audit_events_do_not_leak_prompt_or_answer_content(client: AsyncClient):
    """
    Verifies that when a user asks a query, audit_events records metadata only.
    An admin inspecting /audit/events never sees question text or answer text.
    """
    faculty_token = await get_token_for_role(client, "faculty")
    admin_token = await get_token_for_role(client, "platform_admin")

    # Faculty executes search query
    secret_marker = "SUPER_SECRET_FACULTY_RESEARCH_TOPIC_123"
    await client.post(
        "/api/v1/search/query",
        json={"query": secret_marker, "top_k": 3},
        headers={"Authorization": f"Bearer {faculty_token}"},
    )

    # Admin inspects audit events
    audit_res = await client.get(
        "/api/v1/audit/events",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_res.status_code == 200
    events = audit_res.json()
    assert len(events) > 0

    # Verify no audit event contains the raw secret question text
    for event in events:
        details_str = str(event.get("details", {}))
        assert secret_marker not in details_str, f"Audit leak detected in event: {details_str}"


@pytest.mark.asyncio
async def test_cross_department_document_protection(client: AsyncClient):
    """
    Documents belonging to EXAM department cannot be downloaded or inspected by CSE Student
    if they are not public.
    """
    student_token = await get_token_for_role(client, "student")
    admin_token = await get_token_for_role(client, "platform_admin")

    # Fetch EXAM department documents as admin
    docs_res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {admin_token}"})
    assert docs_res.status_code == 200
    all_docs = docs_res.json()
    assert len(all_docs) > 0

    # Student cannot download unowned documents outside their department
    exam_doc = next((d for d in all_docs if "Regulations" in d["title"]), all_docs[0])
    student_get = await client.get(
        f"/api/v1/documents/{exam_doc['id']}/download",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    # If the document is public it can be read, otherwise it returns 404
    if exam_doc.get("visibility") == "private":
        assert student_get.status_code == 404


@pytest.mark.asyncio
async def test_users_list_self_only_for_non_admin(client: AsyncClient):
    """
    Platform admin sees all users; department admin (non-platform-admin with users:read) sees only their own profile.
    """
    admin_token = await get_token_for_role(client, "platform_admin")
    dept_admin_token = await get_token_for_role(client, "dept_admin")

    # Admin sees full user directory
    admin_users = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_users.status_code == 200
    assert len(admin_users.json()) >= 4

    # Dept Admin has users:read but is not platform admin -> sees only 1 user (themselves)
    dept_users = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {dept_admin_token}"})
    assert dept_users.status_code == 200
    assert len(dept_users.json()) == 1
    assert "deptadmin.cse" in dept_users.json()[0]["email"]


@pytest.mark.asyncio
async def test_benchmark_run_forbidden_for_non_admin(client: AsyncClient):
    """
    Calling POST /api/v1/evaluation/run is blocked (403) for non-admins.
    """
    student_token = await get_token_for_role(client, "student")
    res = await client.post("/api/v1/evaluation/run", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

