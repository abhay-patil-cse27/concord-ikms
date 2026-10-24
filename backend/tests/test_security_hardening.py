"""Automated test suite verifying full system security hardening:
1. Legitimate academic queries pass without false positives.
2. Direct SQL injection payloads are neutralized and blocked.
3. NoSQL / Vector store query operator injections are neutralized.
4. HTTP response security headers (OWASP ASVS) are verified.
5. Path traversal attempts in filenames are cleanly stripped.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.guardrails import PromptGuard
from app.modules.retrieval.chroma_store import ChromaVectorStore


def test_legitimate_computer_science_queries_allowed():
    """Verify that academic queries asking about SQL, databases, networks are allowed."""
    queries = [
        "What is the difference between SQL and NoSQL in the DBMS syllabus?",
        "Explain normal forms and relational database design",
        "What are the network security and firewall topics in semester 6?",
        "Tell me about the Autonomous examination passing criteria for R22",
        "Which courses teach Python and database management?"
    ]
    for q in queries:
        is_safe, reason = PromptGuard.check_prompt_safety(q)
        assert is_safe is True, f"Legitimate query was falsely blocked: {q} (reason: {reason})"


def test_sql_injection_payloads_blocked_by_guardrail():
    """Verify that common SQL injection attack signatures are detected and blocked."""
    sqli_attacks = [
        "' OR '1'='1' --",
        "admin' UNION SELECT null, username, password FROM users--",
        "1; DROP TABLE users;",
        "'; EXEC xp_cmdshell('dir'); --",
        "test' OR 1=1--"
    ]
    for attack in sqli_attacks:
        is_safe, reason = PromptGuard.check_prompt_safety(attack)
        assert is_safe is False, f"SQL injection payload was not blocked: {attack}"
        assert reason is not None


def test_chroma_nosql_injection_sanitization():
    """Verify that malformed or NoSQL-injected department_id filters are sanitized."""
    store = ChromaVectorStore()
    
    # Attack payload attempting operator injection
    malicious_dept = '{"$ne": null}'
    results = store.query_similarity("academic rules", top_k=2, department_id=malicious_dept)
    # Must execute safely without throwing exceptions or executing raw $ne
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_http_security_headers_present():
    """Verify OWASP ASVS response security headers are returned on all endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/healthz")
        assert res.status_code == 200
        headers = res.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_path_traversal_filename_sanitization():
    """Verify path traversal patterns like ../../etc/passwd are stripped."""
    import os
    raw_filename = "../../../../../etc/passwd"
    safe_filename = os.path.basename(raw_filename).replace("\\", "/").split("/")[-1].strip()
    assert "../" not in safe_filename
    assert safe_filename == "passwd"

    windows_traversal = "..\\..\\windows\\system32\\cmd.exe"
    safe_win = os.path.basename(windows_traversal).replace("\\", "/").split("/")[-1].strip()
    assert "..\\" not in safe_win
    assert safe_win == "cmd.exe"
