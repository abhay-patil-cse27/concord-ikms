"""Grounded Question Answering (RAG) HTTP endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission
from app.modules.identity.models import User
from app.modules.retrieval.schemas import RAGAskRequest, RAGAskResponse
from app.modules.retrieval.rag_service import RAGService
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate

router = APIRouter(prefix="/rag", tags=["Grounded Q&A (RAG)"])
@router.post("/ask", response_model=RAGAskResponse)
async def ask_grounded_rag(
    request: RAGAskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents:read"))
):
    """
    Execute grounded Question & Answering powered by Groq Cloud (Llama 3.3).
    Strictly scoped by the user's role and authorized department boundaries.
    Generates verifiable responses with exact document and chunk citations.
    """
    rag_service = RAGService()
    response = await rag_service.ask(
        db=db,
        request=request,
        current_user=current_user
    )

    # Log audit record for institutional RAG query (Metadata only - privacy enforced)
    await AuditService.log_event(
        db=db,
        data=AuditEventCreate(
            action="rag.ask",
            user_id=current_user.id,
            resource_type="rag",
            resource_id=None,
            details={
                "query_length": len(request.query),
                "confidence": response.confidence,
                "model_used": response.model_used,
                "citations_count": len(response.citations),
                "latency_ms": response.latency_ms,
                "department_id": request.department_id,
            },
            status="success"
        )
    )

    return response
