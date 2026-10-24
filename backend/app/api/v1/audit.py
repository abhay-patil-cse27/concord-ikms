from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_permission
from app.modules.identity.models import User
from app.modules.audit.schemas import AuditEventResponse
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
