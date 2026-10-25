"""Automated test suite verifying the in-memory token bucket rate limiter."""
import pytest
from app.core.rate_limiter import InMemoryRateLimiter


def test_rate_limiter_allows_under_quota():
    limiter = InMemoryRateLimiter(requests_per_minute=5)
    ip = "192.168.1.10"
    for _ in range(5):
        allowed, retry_after = limiter.is_allowed(ip)
        assert allowed is True
        assert retry_after == 0


def test_rate_limiter_blocks_when_quota_exceeded():
    limiter = InMemoryRateLimiter(requests_per_minute=3)
    ip = "192.168.1.20"
    for _ in range(3):
        allowed, _ = limiter.is_allowed(ip)
        assert allowed is True

    # 4th request must be rejected with retry_after > 0
    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is False
    assert retry_after > 0


def test_rate_limiter_isolates_different_ips():
    limiter = InMemoryRateLimiter(requests_per_minute=2)
    ip_a = "10.0.0.1"
    ip_b = "10.0.0.2"

    # Exhaust IP A
    limiter.is_allowed(ip_a)
    limiter.is_allowed(ip_a)
    allowed_a, _ = limiter.is_allowed(ip_a)
    assert allowed_a is False

    # IP B should still be allowed
    allowed_b, _ = limiter.is_allowed(ip_b)
    assert allowed_b is True
