"""Token Bucket In-Memory Rate Limiter for CONCORD IKMS.

Zero-dependency, thread-safe rate limiting:
- Protects LLM inference endpoints (/rag/ask, /conversations/ask) from denial-of-wallet / script loops.
- Generous limits per IP / client (e.g. 60 requests per minute).
- Graceful HTTP 429 response with Retry-After header.
"""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.logging import logger


class InMemoryRateLimiter:
    """Sliding window token bucket rate limiter per client IP."""

    def __init__(self, requests_per_minute: int = 60):
        self.rate_limit = requests_per_minute
        self.window_seconds = 60.0
        # client_ip -> list of epoch timestamps
        self.history: Dict[str, list] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        """
        Returns (is_allowed, retry_after_seconds).
        """
        now = time.time()
        cutoff = now - self.window_seconds
        
        # Clean timestamps older than 60s
        timestamps = [ts for ts in self.history[client_ip] if ts > cutoff]
        self.history[client_ip] = timestamps

        if len(timestamps) >= self.rate_limit:
            oldest_in_window = timestamps[0]
            retry_after = max(1, int(self.window_seconds - (now - oldest_in_window)))
            return False, retry_after

        # Record this request
        self.history[client_ip].append(now)
        return True, 0


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Intercepts requests to resource-heavy endpoints (/rag, /conversations/ask) and enforces rate limits."""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.limiter = InMemoryRateLimiter(requests_per_minute=requests_per_minute)
        # Apply rate limits specifically to LLM inference routes
        self.rate_limited_prefixes = ("/api/v1/rag/ask", "/api/v1/conversations/ask")

    async def dispatch(self, request: Request, call_next):
        # Only rate-limit POST calls to AI generation endpoints
        if request.method == "POST" and any(request.url.path.startswith(prefix) for prefix in self.rate_limited_prefixes):
            client_ip = request.client.host if request.client else "127.0.0.1"
            is_allowed, retry_after = self.limiter.is_allowed(client_ip)

            if not is_allowed:
                logger.warning(f"Rate limit exceeded for client {client_ip} on {request.url.path}")
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many requests. Please wait {retry_after} seconds before asking again.",
                            "details": {"retry_after_seconds": retry_after}
                        }
                    },
                    headers={"Retry-After": str(retry_after)}
                )

        return await call_next(request)
