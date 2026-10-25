from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.modules.identity.models import User
from app.modules.audit.schemas import AuditEventResponse, FeedbackCreate, AuditEventCreate
from app.modules.audit.service import AuditService

from app.core.pagination import PaginationParams

router = APIRouter(prefix="/audit", tags=["Security & Audit Logs"])


@router.get("/events", response_model=List[AuditEventResponse], summary="Inspect Security Audit Events")
async def list_audit_events(
    pagination: PaginationParams = Depends(),
    action: Optional[str] = None,
    current_user: User = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves security-relevant institutional audit records. Requires 'audit:read' permission."""
    return await AuditService.get_events(db, limit=pagination.limit, action=action)


@router.post("/feedback", status_code=status.HTTP_201_CREATED, summary="Submit RAG Answer Feedback")
async def submit_answer_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Submits user feedback (helpful / unhelpful) or flags hallucinations for continuous improvement.
    Safe, append-only operational audit event.
    """
    await AuditService.log_event(
        db=db,
        data=AuditEventCreate(
            action="rag.feedback",
            user_id=current_user.id,
            resource_type="rag_response",
            resource_id=None,
            status="SUCCESS",
            details={
                "rating": payload.rating,
                "reason": payload.reason,
                "content_snippet": (payload.message_content[:200] if payload.message_content else None),
                **(payload.details or {})
            }
        )
    )
    return {"status": "recorded", "rating": payload.rating}
