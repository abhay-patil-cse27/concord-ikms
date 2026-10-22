"""Evaluation and Benchmarking HTTP Endpoints."""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission
from app.modules.identity.models import User
from app.modules.evaluation.runner import BenchmarkRunner

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarks"])


@router.get("/metrics")
async def get_benchmark_overview(
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Returns baseline institutional benchmark metrics for CONCORD."""
    runner = BenchmarkRunner()
    return await runner.run_benchmark(db=db, current_user=current_user, top_k=5)


@router.post("/run")
async def run_live_benchmark(
    current_user: User = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Triggers an on-demand live benchmark evaluation across lexical, vector, and hybrid modes."""
    runner = BenchmarkRunner()
    return await runner.run_benchmark(db=db, current_user=current_user, top_k=5)
