"""Governance and Human-in-the-Loop Document & User Approval Router."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas import UserResponse, UserApprovalAction
from app.modules.identity.service import IdentityService
from app.modules.documents.schemas import DocumentRead, DocumentApprovalDecision
from app.modules.documents.service import DocumentService
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate

router = APIRouter(prefix="/governance", tags=["Governance & Approvals"])


@router.get("/pending-documents", response_model=List[DocumentRead])
async def list_pending_documents(
    current_user: User = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists documents awaiting human approval.
    HODs only see their assigned department. Platform admins see all.
    """
    user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
    dept_id = None if "platform_admin" in user_roles else current_user.department_id

    service = DocumentService(db)
    docs = await service.list_pending_documents(department_id=dept_id)
    return [DocumentRead.model_validate(d) for d in docs]


@router.post("/documents/{document_id}/review", response_model=DocumentRead)
async def review_document(
    request: Request,
    document_id: str,
    payload: DocumentApprovalDecision,
    current_user: User = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Human-in-the-loop approval or rejection of an institutional document.
    Upon approval, document vectors are atomically synced into the active ChromaDB index.
    """
    service = DocumentService(db)
    client_ip = request.client.host if request.client else None

    doc = await service.review_document_approval(
        document_id=document_id,
        decision=payload.decision,
        reviewer_id=str(current_user.id),
        notes=payload.notes,
        ip_address=client_ip
    )
    return DocumentRead.model_validate(doc)


# ---------------------------------------------------------
# Milestone 12: 2-Tier Institutional User Approval Workflow
# ---------------------------------------------------------

@router.get("/pending-users", response_model=List[UserResponse], summary="List Pending User Registrations")
async def list_pending_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists users in the institutional approval queue:
    - Department Admin (HOD): views Tier 1 registrations within their assigned department.
    - Platform Admin (Super Admin): views all pending Tier 1 & Tier 2 registrations.
    """
    return await IdentityService.get_pending_approvals(db, current_user)


@router.post("/users/{user_id}/review", summary="Review User Registration")
async def review_user_registration(
    user_id: str,
    payload: UserApprovalAction,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes a Tier 1 or Tier 2 approval/rejection decision on a registered applicant.
    On approval: status -> 'approved', is_active -> True.
    On rejection: status -> 'rejected', is_active -> False with recorded reason.
    """
    client_ip = request.client.host if request.client else None
    result = await IdentityService.review_user_approval(
        db=db,
        target_user_id=user_id,
        action=payload.action,
        reason=payload.reason,
        current_user=current_user
    )

    await AuditService.log_event(
        db,
        AuditEventCreate(
            user_id=current_user.id,
            action=f"USER_REGISTRATION_{payload.action.upper()}",
            resource_type="user",
            resource_id=user_id,
            details={
                "reviewer": current_user.email,
                "action": payload.action,
                "reason": payload.reason,
                "status": result.get("approval_status")
            },
            ip_address=client_ip,
            request_id=request.headers.get("x-request-id"),
        )
    )
    return result
