"""Governance and Human-in-the-Loop Document Approval Router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.modules.identity.models import User
from app.modules.documents.schemas import DocumentRead, DocumentApprovalDecision
from app.modules.documents.service import DocumentService

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
