"""Documents management and ingestion service."""
import hashlib
import io
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.core.errors import NotFoundError, ConflictError
from app.core.storage import storage_provider
from app.modules.documents.models import Document, DocumentChunk
from app.modules.documents.parsers import get_parser_for_mime_or_ext
from app.modules.documents.chunker import default_chunker
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ingest_document(
        self,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        department_id: str,
        uploader_id: str,
        title: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Document:
        """Processes and chunks an uploaded document synchronously/transactionally."""
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)
        display_title = title.strip() if title and title.strip() else filename

        # Check for duplicate document in the same department
        dup_query = select(Document).where(
            Document.department_id == str(department_id),
            Document.sha256_hash == sha256_hash,
        )
        dup_res = await self.db.execute(dup_query)
        existing_doc = dup_res.scalar_one_or_none()
        if existing_doc:
            raise ConflictError(
                f"Document '{filename}' with identical hash has already been ingested in this department."
            )

        # Generate unique storage path: storage/documents/{dept_id}/{uuid}_{filename}
        doc_id = str(uuid.uuid4())
        storage_rel_path = f"{department_id}/{doc_id}_{filename}"
        await storage_provider.save_file(io.BytesIO(file_bytes), storage_rel_path)

        # Instantiate document record
        document = Document(
            id=doc_id,
            title=display_title,
            filename=filename,
            file_path=storage_rel_path,
            file_size_bytes=file_size,
            mime_type=mime_type or "application/octet-stream",
            sha256_hash=sha256_hash,
            department_id=str(department_id),
            uploader_id=str(uploader_id),
            status="processing",
            chunk_count=0,
        )
        self.db.add(document)
        await self.db.flush()

        # Parse text
        try:
            parser = get_parser_for_mime_or_ext(filename, mime_type)
            extracted_pages = parser.extract_pages(file_bytes)
            
            # Chunk extracted pages
            chunk_results = default_chunker.chunk_pages(extracted_pages)
            
            for chunk_data in chunk_results:
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=document.id,
                    chunk_index=chunk_data.index,
                    content=chunk_data.content,
                    char_count=chunk_data.char_count,
                    metadata_=chunk_data.metadata,
                )
                self.db.add(chunk)

            document.chunk_count = len(chunk_results)
            document.status = "processed"
            document.error_message = None
            logger.info(
                f"Document {document.id} ({filename}) parsed successfully: {len(extracted_pages)} pages, {len(chunk_results)} chunks"
            )

        except Exception as exc:
            logger.error(f"Failed parsing document {document.id} ({filename}): {exc}")
            document.status = "failed"
            document.error_message = str(exc)

        await self.db.commit()
        await self.db.refresh(document)

        # Audit event
        try:
            await AuditService.log_event(
                self.db,
                AuditEventCreate(
                    user_id=str(uploader_id),
                    action="document.uploaded",
                    resource_type="document",
                    resource_id=str(document.id),
                    status="SUCCESS" if document.status == "processed" else "FAILED",
                    details={
                        "filename": filename,
                        "mime_type": mime_type,
                        "file_size": file_size,
                        "chunks": document.chunk_count,
                        "status": document.status,
                    },
                    ip_address=ip_address,
                ),
            )
        except Exception as audit_exc:
            logger.warning(f"Failed to log document audit event: {audit_exc}")

        return document

    async def list_documents(
        self,
        department_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Document]:
        """Lists institutional documents with optional department and status filtering."""
        query = select(Document).order_by(Document.created_at.desc())
        if department_id:
            query = query.where(Document.department_id == str(department_id))
        if status:
            query = query.where(Document.status == status)
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_document_with_chunks(self, document_id: str) -> Document:
        """Retrieves a document with all parsed chunks eagerly loaded."""
        query = (
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.id == str(document_id))
        )
        result = await self.db.execute(query)
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")
        return doc

    async def delete_document(
        self,
        document_id: str,
        user_id: str,
        ip_address: Optional[str] = None,
    ) -> bool:
        """Deletes a document, its database chunks, and raw storage file."""
        query = select(Document).where(Document.id == str(document_id))
        res = await self.db.execute(query)
        doc = res.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")

        # Delete from disk/storage
        try:
            await storage_provider.delete_file(doc.file_path)
        except Exception as exc:
            logger.warning(f"Could not delete storage file {doc.file_path}: {exc}")

        # Delete from database (cascades chunks)
        await self.db.delete(doc)
        await self.db.commit()

        # Audit event
        try:
            await AuditService.log_event(
                self.db,
                AuditEventCreate(
                    user_id=str(user_id),
                    action="document.deleted",
                    resource_type="document",
                    resource_id=str(document_id),
                    status="SUCCESS",
                    details={"filename": doc.filename, "department_id": str(doc.department_id)},
                    ip_address=ip_address,
                ),
            )
        except Exception as audit_exc:
            logger.warning(f"Failed to log document deletion audit: {audit_exc}")

        return True
