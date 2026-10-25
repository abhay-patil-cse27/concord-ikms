"""Documents API Router."""
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request, BackgroundTasks, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.core.storage import storage_provider
from app.core.errors import ValidationError, NotFoundError
from app.core.tasks import job_manager
from app.modules.identity.models import User
from app.modules.documents.schemas import (
    DocumentRead,
    DocumentDetailRead,
    DocumentUploadResponse,
    DocumentLifecycleUpdate,
    AsyncDocumentJobResponse,
    DocumentJobStatusResponse,
)
from app.modules.documents.service import DocumentService, run_async_document_ingestion

from app.core.pagination import PaginationParams

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
    """Uploads, extracts, chunks, and indexes an institutional document synchronously."""
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


@router.post("/upload-async", response_model=AsyncDocumentJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document_async(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    department_id: str = Form(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(require_permission("documents:write")),
):
    """Uploads and ingests document asynchronously, returning job ID for progress tracking."""
    if not file.filename:
        raise ValidationError("Missing filename in upload payload")

    file_bytes = await file.read()
    if not file_bytes:
        raise ValidationError("Uploaded file is empty (0 bytes)")

    job_id = f"job_ingest_{uuid.uuid4().hex[:12]}"
    client_ip = request.client.host if request.client else None

    await job_manager.create_job(
        job_id=job_id,
        phase="queued",
        message=f"Upload received for '{file.filename}'. Queued for processing.",
    )

    background_tasks.add_task(
        run_async_document_ingestion,
        job_id=job_id,
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        department_id=str(department_id),
        uploader_id=str(current_user.id),
        title=title,
        ip_address=client_ip,
    )

    return AsyncDocumentJobResponse(
        job_id=job_id,
        status="pending",
        phase="queued",
        message=f"Ingestion job {job_id} scheduled for {file.filename}.",
    )


@router.get("/jobs/{job_id}", response_model=DocumentJobStatusResponse)
async def get_document_job_status(
    job_id: str,
    current_user: User = Depends(require_permission("documents:read")),
):
    """Retrieves real-time progress percentage and state for an asynchronous ingestion job."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise NotFoundError(f"Ingestion job '{job_id}' not found.")
    return DocumentJobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        phase=job.phase,
        progress=job.progress,
        message=job.message,
        result=job.result,
        error=job.error,
    )


@router.get("", response_model=List[DocumentRead])
async def list_documents(
    pagination: PaginationParams = Depends(),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Lists institutional documents with department and status filtering scoped by tenant boundaries."""
    service = DocumentService(db)
    return await service.list_documents(
        current_user=current_user,
        department_id=department_id,
        status=status,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/{document_id}", response_model=DocumentDetailRead)
async def get_document(
    document_id: str,
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves document details with extracted chunk segments, enforcing DocumentPolicy."""
    service = DocumentService(db)
    return await service.get_document_with_chunks(document_id, current_user=current_user)


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Downloads raw file bytes of an institutional document, enforcing DocumentPolicy."""
    service = DocumentService(db)
    doc = await service.get_document_with_chunks(document_id, current_user=current_user)
    file_bytes = await storage_provider.read_file(doc.file_path)
    
    return Response(
        content=file_bytes,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.patch("/{document_id}/lifecycle", response_model=DocumentRead)
async def update_document_lifecycle(
    request: Request,
    document_id: str,
    payload: DocumentLifecycleUpdate,
    current_user: User = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
):
    """Updates document lifecycle state, enforcing DocumentPolicy write rules."""
    service = DocumentService(db)
    client_ip = request.client.host if request.client else None
    doc = await service.update_lifecycle(
        document_id=document_id,
        lifecycle_status=payload.lifecycle_status,
        version=payload.version,
        superseded_by_id=payload.superseded_by_id,
        user_id=str(current_user.id),
        current_user=current_user,
        ip_address=client_ip,
    )
    return DocumentRead.model_validate(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    request: Request,
    document_id: str,
    current_user: User = Depends(require_permission("documents:delete")),
    db: AsyncSession = Depends(get_db),
):
    """Permanently deletes a document, enforcing DocumentPolicy delete rules."""
    service = DocumentService(db)
    client_ip = request.client.host if request.client else None
    await service.delete_document(
        document_id=document_id,
        user_id=str(current_user.id),
        current_user=current_user,
        ip_address=client_ip
    )
    return None

