import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.logging import logger, correlation_id_ctx
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.seed import seed_database
from app.core.errors import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.api.v1.router import api_v1_router
from app.modules.documents.models import Document, DocumentChunk  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown routines."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    
    # Create tables if not present
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial database state
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    yield

    logger.info("Shutting down CONCORD backend services...")
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Trust-Aware Institutional Intelligence",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
cors_kwargs = {
    "allow_origins": settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if getattr(settings, "CORS_ORIGIN_REGEX", None):
    cors_kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

# AI Rate Limiting Middleware (Zero-dependency token bucket protection)
from app.core.rate_limiter import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)


@app.middleware("http")
async def request_correlation_and_timing_middleware(request: Request, call_next):
    """Attaches correlation ID to every request and logs execution duration."""
    req_id = request.headers.get("x-request-id") or f"req-{uuid.uuid4().hex[:8]}"
    correlation_id_ctx.set(req_id)
    
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)
        
        # Enterprise Security & Hardening Headers (OWASP ASVS 4.1)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"{request.method} {request.url.path} failed in {duration_ms}ms: {exc}")
        raise exc


# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Versioned API routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/", summary="Root Status")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": f"{settings.API_V1_PREFIX}/healthz",
    }
