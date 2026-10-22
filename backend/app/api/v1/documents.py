"""Documents API Router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.core.storage import storage_provider
from app.core.errors import ValidationError
from app.modules.identity.models import User
from app.modules.documents.schemas import DocumentRead, DocumentDetailRead, DocumentUploadResponse
from app.modules.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    department_id: str = Form(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
):
    """Uploads, extracts, chunks, and indexes an institutional document."""
    if not file.filename:
        raise ValidationError("Missing filename in upload payload")

    file_bytes = await file.read()
    if not file_bytes:
        raise ValidationError("Uploaded file is empty (0 bytes)")

    service = DocumentService(db)
    client_ip = request.client.host if request.client else None

    doc = await service.ingest_document(
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        department_id=str(department_id),
        uploader_id=str(current_user.id),
        title=title,
        ip_address=client_ip,
    )

    return DocumentUploadResponse(
        document=DocumentRead.model_validate(doc),
        message=f"Document successfully parsed and converted into {doc.chunk_count} semantic chunks.",
    )


@router.get("", response_model=List[DocumentRead])
async def list_documents(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Lists institutional documents with optional department and status filtering."""
    service = DocumentService(db)
    return await service.list_documents(
        department_id=department_id,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/{document_id}", response_model=DocumentDetailRead)
async def get_document(
    document_id: str,
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves document details with extracted chunk segments."""
    service = DocumentService(db)
    return await service.get_document_with_chunks(document_id)


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Downloads raw file bytes of an institutional document."""
    service = DocumentService(db)
    doc = await service.get_document_with_chunks(document_id)
    file_bytes = await storage_provider.read_file(doc.file_path)
    
    return Response(
        content=file_bytes,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    request: Request,
    document_id: str,
    current_user: User = Depends(require_permission("documents:delete")),
    db: AsyncSession = Depends(get_db),
):
    """Permanently deletes a document, its database chunks, and disk storage."""
    service = DocumentService(db)
    client_ip = request.client.host if request.client else None
    await service.delete_document(document_id, user_id=str(current_user.id), ip_address=client_ip)
    return None
