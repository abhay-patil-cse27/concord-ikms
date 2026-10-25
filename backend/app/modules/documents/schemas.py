"""Pydantic schemas for document ingestion and management."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class DocumentChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chunk_index: int
    content: str
    char_count: int
    metadata_: Dict[str, Any]
    created_at: datetime


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    filename: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    department_id: str
    uploader_id: str
    status: str
    lifecycle_status: str = "active"
    version: str = "v1.0"
    effective_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    superseded_by_id: Optional[str] = None
    approval_status: str = "approved"
    approved_by_id: Optional[str] = None
    approval_notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    error_message: Optional[str] = None
    chunk_count: int
    created_at: datetime
    updated_at: datetime


class DocumentDetailRead(DocumentRead):
    chunks: List[DocumentChunkRead] = []
    superseded_by_title: Optional[str] = None
    approved_by_email: Optional[str] = None


class DocumentApprovalDecision(BaseModel):
    decision: str  # "approved" or "rejected"
    notes: Optional[str] = None



class DocumentLifecycleUpdate(BaseModel):
    lifecycle_status: str
    version: Optional[str] = None
    superseded_by_id: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    document: DocumentRead
    message: str


class AsyncDocumentJobResponse(BaseModel):
    job_id: str
    status: str
    phase: str
    message: str


class DocumentJobStatusResponse(BaseModel):
    job_id: str
    status: str
    phase: str
    progress: int
    message: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
