import time
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger

router = APIRouter(tags=["Health & Readiness"])


@router.get("/healthz", summary="Liveness Probe")
async def healthz():
    """Returns basic service liveness status."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/readyz", summary="Readiness Probe")
async def readyz(db: AsyncSession = Depends(get_db)):
    """Validates operational readiness, including database connectivity."""
    start_time = time.time()
    db_status = "connected"
    db_latency_ms = 0.0

    try:
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as exc:
        logger.error(f"Readiness check database failure: {exc}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unready",
                "database": "disconnected",
                "error": str(exc),
            }
        )

    return {
        "status": "ready",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "checks": {
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
            }
        }
    }
