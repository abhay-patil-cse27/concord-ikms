"""Schemas for multi-turn conversations and message turns."""
from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class MessageItemResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    confidence: Optional[str] = None
    model_used: Optional[str] = None
    latency_ms: Optional[float] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    title: str
    user_id: str
    department_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages_count: Optional[int] = 0


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageItemResponse] = []


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    department_id: Optional[str] = None


class ConversationalAskRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="User follow-up or initial question")
    conversation_id: Optional[str] = Field(None, description="Existing conversation session ID, or null to spawn a new session")
    department_id: Optional[str] = Field(None, description="Optional target department scope")
    top_k: int = Field(5, ge=1, le=10)
    include_superseded: bool = Field(False)
