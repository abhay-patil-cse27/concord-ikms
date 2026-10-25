"""REST endpoints for multi-turn conversations and message threads."""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.core.access.policy import ConversationPolicy, get_conversation_policy
from app.core.pagination import PaginationParams
from app.modules.identity.models import User
from app.modules.conversations.service import ConversationService
from app.modules.conversations.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreateRequest,
    ConversationalAskRequest
)

router = APIRouter(prefix="/conversations", tags=["Conversational Memory"])


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    policy: ConversationPolicy = Depends(get_conversation_policy)
):
    """List recent conversation sessions belonging to the authenticated user."""
    service = ConversationService()
    convs = await service.list_user_conversations(db, current_user.id, limit=pagination.limit)
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            user_id=c.user_id,
            owner_id=getattr(c, "owner_id", c.user_id),
            visibility=getattr(c, "visibility", "private"),
            department_id=c.department_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages_count=len(c.messages) if c.messages else 0
        )
        for c in convs
    ]


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_new_conversation(
    payload: ConversationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    policy: ConversationPolicy = Depends(get_conversation_policy)
):
    """Explicitly create a new conversation session. Owner ID is strictly bound to token."""
    service = ConversationService()
    conv = await service.create_conversation(
        db=db,
        user_id=current_user.id,
        title=payload.title,
        department_id=payload.department_id,
        visibility="private"
    )
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        user_id=conv.user_id,
        owner_id=conv.owner_id,
        visibility=conv.visibility,
        department_id=conv.department_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages_count=0
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full message history for a conversation thread."""
    service = ConversationService()
    conv = await service.get_conversation(db, conversation_id, current_user)
    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        user_id=conv.user_id,
        department_id=conv.department_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages_count=len(conv.messages),
        messages=[
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "role": m.role,
                "content": m.content,
                "citations": m.citations,
                "confidence": m.confidence,
                "model_used": m.model_used,
                "latency_ms": m.latency_ms,
                "created_at": m.created_at
            }
            for m in conv.messages
        ]
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation thread and all associated messages."""
    service = ConversationService()
    await service.delete_conversation(db, conversation_id, current_user)
    return None


@router.post("/ask", response_model=Dict[str, Any])
async def ask_with_conversation(
    payload: ConversationalAskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents:read"))
):
    """
    Execute a conversational query turn.
    Automatically rewrites pronouns using preceding conversation history,
    grounds the answer against verified institutional evidence, and saves the turn.
    """
    service = ConversationService()
    result = await service.ask_in_conversation(
        db=db,
        query=payload.query,
        current_user=current_user,
        conversation_id=payload.conversation_id,
        department_id=payload.department_id,
        top_k=payload.top_k,
        include_superseded=payload.include_superseded
    )

    # Log turn audit event with metadata only - no private conversation content
    from app.modules.audit.service import AuditService
    from app.modules.audit.schemas import AuditEventCreate
    await AuditService.log_event(
        db=db,
        data=AuditEventCreate(
            action="conversation.turn",
            user_id=current_user.id,
            resource_type="conversation",
            resource_id=result.get("conversation_id"),
            details={
                "query_length": len(payload.query),
                "answer_length": len(result.get("answer", "")),
                "citations_count": len(result.get("citations", [])),
                "model_used": result.get("model_used"),
                "latency_ms": result.get("latency_ms"),
            },
            status="success"
        )
    )
    return result


@router.post("/ask-stream")
async def ask_with_conversation_stream(
    payload: ConversationalAskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents:read"))
):
    """
    Execute a conversational query turn with real-time SSE token streaming.
    Yields standardized events: session, status, citations, token, done.
    """
    from fastapi.responses import StreamingResponse

    service = ConversationService()
    generator = service.stream_ask_in_conversation(
        db=db,
        query=payload.query,
        current_user=current_user,
        conversation_id=payload.conversation_id,
        department_id=payload.department_id,
        top_k=payload.top_k,
        include_superseded=payload.include_superseded
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

