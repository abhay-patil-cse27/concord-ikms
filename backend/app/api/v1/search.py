"""Search and Retrieval HTTP endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.modules.identity.models import User
from app.modules.retrieval.schemas import SearchQueryRequest, SearchQueryResponse
from app.modules.retrieval.service import RetrievalService
from app.modules.audit.service import AuditService

router = APIRouter(prefix="/search", tags=["Search & Retrieval"])
retrieval_service = RetrievalService()


@router.post("/query", response_model=SearchQueryResponse)
async def query_knowledge_base(
    request: SearchQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents:read"))
):
    """
    Execute hybrid search over authorized institutional documents.
    Enforces department boundary scoping based on the authenticated persona.
    """
    response = await retrieval_service.search(
        db=db,
        query=request.query,
        current_user=current_user,
        top_k=request.top_k,
        target_department_id=request.department_id,
        mode=request.mode,
        lifecycle_status=request.lifecycle_status
    )

    # Log search audit event (Metadata only - privacy enforced)
    from app.modules.audit.schemas import AuditEventCreate
    await AuditService.log_event(
        db=db,
        data=AuditEventCreate(
            action="search.query",
            user_id=current_user.id,
            resource_type="search",
            resource_id=None,
            details={
                "query_length": len(request.query),
                "mode": request.mode,
                "results_count": len(response.results),
                "latency_ms": response.latency_ms
            },
            status="success"
        )
    )

    return response
