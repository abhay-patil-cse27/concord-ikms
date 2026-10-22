"""Integration tests for Conversational Multi-Turn Memory and Session Persistence."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_conversational_turn_creation_and_context_rewriting(client: AsyncClient):
    # 1. Login as Platform Admin
    login_res = await client.post("/api/v1/auth/demo-login", json={"role_code": "platform_admin"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start a new conversation with Turn 1
    t1_payload = {
        "query": "What is the passing criteria for Autonomous Exam under 2024 regulations?",
        "top_k": 3
    }
    t1_res = await client.post("/api/v1/conversations/ask", json=t1_payload, headers=headers)
    assert t1_res.status_code == 200
    t1_data = t1_res.json()
    conv_id = t1_data["conversation_id"]
    assert conv_id is not None
    assert len(t1_data["answer"]) > 0

    # 3. Follow-up Turn 2 with pronoun ("What are the attendance requirements for it?")
    t2_payload = {
        "conversation_id": conv_id,
        "query": "What are the attendance requirements for it?",
        "top_k": 3
    }
    t2_res = await client.post("/api/v1/conversations/ask", json=t2_payload, headers=headers)
    assert t2_res.status_code == 200
    t2_data = t2_res.json()
    assert t2_data["conversation_id"] == conv_id
    # Verify that query context rewriting incorporated antecedent subject
    assert "passing criteria" in t2_data["effective_query"].lower() or "autonomous exam" in t2_data["effective_query"].lower()

    # 4. Fetch Conversation Detail & Verify 4 total messages (2 user + 2 assistant)
    hist_res = await client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert len(hist_data["messages"]) == 4
    assert hist_data["messages"][0]["role"] == "user"
    assert hist_data["messages"][1]["role"] == "assistant"
    assert hist_data["messages"][2]["role"] == "user"
    assert hist_data["messages"][3]["role"] == "assistant"

    # 5. List Conversations
    list_res = await client.get("/api/v1/conversations", headers=headers)
    assert list_res.status_code == 200
    conv_list = list_res.json()
    assert any(c["id"] == conv_id for c in conv_list)

    # 6. Delete conversation
    del_res = await client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_res.status_code == 204
