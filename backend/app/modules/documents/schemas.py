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
    error_message: Optional[str] = None
    chunk_count: int
    created_at: datetime
    updated_at: datetime


class DocumentDetailRead(DocumentRead):
    chunks: List[DocumentChunkRead] = []


class DocumentUploadResponse(BaseModel):
    document: DocumentRead
    message: str
