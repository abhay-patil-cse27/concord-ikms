"""Unit and integration tests for SSRF network guardrails and web notice crawler."""
import pytest
from app.core.errors import ValidationError
from app.core.network_guard import validate_public_url
from app.modules.documents.web_parser import WebNoticeParser


def test_ssrf_guardrail_blocks_loopback_and_private_ips():
    """Verify that loopback, localhost, and RFC 1918 IPs are rejected with ValidationError."""
    # Localhost alias
    with pytest.raises(ValidationError) as exc:
        validate_public_url("http://localhost/admin")
    assert "localhost" in str(exc.value).lower()

    # Loopback IP
    with pytest.raises(ValidationError) as exc:
        validate_public_url("http://127.0.0.1:8000/internal")
    assert "forbidden" in str(exc.value).lower()

    # AWS / Cloud Metadata endpoint
    with pytest.raises(ValidationError) as exc:
        validate_public_url("http://169.254.169.254/latest/meta-data")
    assert "forbidden" in str(exc.value).lower()

    # Disallowed protocols
    with pytest.raises(ValidationError) as exc:
        validate_public_url("file:///etc/passwd")
    assert "protocol" in str(exc.value).lower()


def test_web_notice_parser_extracts_clean_markdown():
    """Verify that HTML boilerplate is stripped and clean structural markdown is generated."""
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Academic Examination Notification 2026</title>
        <style>.hero { color: red; }</style>
        <script>console.log('malicious script');</script>
    </head>
    <body>
        <nav><a href="/home">Home</a><a href="/login">Login</a></nav>
        <main>
            <h1>Semester V End-Exam Guidelines</h1>
            <p>All enrolled students must register for their elective papers by <strong>October 30</strong>.</p>
            <ul>
                <li>Theory Exam: 70 Marks</li>
                <li>Continuous Evaluation: 30 Marks</li>
            </ul>
        </main>
        <footer>Copyright 2026 KIT College. All rights reserved.</footer>
    </body>
    </html>
    """

    title, markdown = WebNoticeParser.parse_html_to_markdown(sample_html)

    assert title == "Academic Examination Notification 2026"
    # Boilerplate stripped
    assert "console.log" not in markdown
    assert "Copyright 2026" not in markdown
    assert "Home" not in markdown
    # Content preserved
    assert "# Semester V End-Exam Guidelines" in markdown
    assert "All enrolled students must register" in markdown
    assert "- Theory Exam: 70 Marks" in markdown
