"""Documents management and ingestion service."""
import hashlib
import io
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.core.errors import NotFoundError, ConflictError, ValidationError
from app.core.storage import storage_provider
from app.modules.documents.models import Document, DocumentChunk
from app.modules.documents.parsers import get_parser_for_mime_or_ext
from app.modules.documents.chunker import get_chunker_for_document
from app.modules.identity.models import User
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
            owner_id=str(uploader_id),
            visibility="department",
            status="processing",
            chunk_count=0,
        )
        self.db.add(document)
        await self.db.flush()

        # Parse text
        try:
            parser = get_parser_for_mime_or_ext(filename, mime_type)
            extracted_pages = parser.extract_pages(file_bytes)
            
            # Resolve format-specific chunking strategy
            from app.modules.documents.chunker import get_chunker_for_document
            chunker = get_chunker_for_document(filename, mime_type)
            chunk_results = chunker.chunk_pages(extracted_pages)
            
            chunk_models = []
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
                chunk_models.append(chunk)

            document.chunk_count = len(chunk_results)
            document.status = "processed"
            document.error_message = None
            logger.info(
                f"Document {document.id} ({filename}) parsed successfully: {len(extracted_pages)} pages, {len(chunk_results)} chunks"
            )

            # Sync vectors into ChromaDB embedded store
            try:
                from app.modules.retrieval.chroma_store import get_vector_store
                chroma_chunks = []
                for chunk_obj in chunk_models:
                    meta = chunk_obj.metadata_.copy() if chunk_obj.metadata_ else {}
                    meta.update({
                        "document_id": document.id,
                        "document_title": display_title,
                        "document_filename": filename,
                        "department_id": str(department_id),
                        "lifecycle_status": document.lifecycle_status,
                        "version": document.version,
                        "chunk_index": chunk_obj.chunk_index,
                        "page_number": meta.get("page_number", 1)
                    })
                    chroma_chunks.append({
                        "id": str(chunk_obj.id),
                        "content": chunk_obj.content,
                        "metadata": meta
                    })
                get_vector_store().upsert_chunks(chroma_chunks)
            except Exception as chroma_exc:
                logger.warning(f"ChromaDB ingestion sync warning: {chroma_exc}")

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
        current_user: Optional[User] = None,
        department_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Document]:
        """Lists institutional documents with department/public visibility policy filtering."""
        from sqlalchemy import or_
        from app.core.access.policy import _get_user_roles, _get_user_dept_ids

        query = select(Document).order_by(Document.created_at.desc())
        
        # Enforce multi-tenant data isolation if current_user provided
        if current_user:
            roles = _get_user_roles(current_user)
            if "platform_admin" not in roles:
                user_depts = _get_user_dept_ids(current_user)
                # Lower roles see only public documents, or documents of departments they belong to, or documents they own
                query = query.where(
                    or_(
                        Document.visibility == "public",
                        Document.owner_id == current_user.id,
                        Document.uploader_id == current_user.id,
                        Document.department_id.in_(user_depts) if user_depts else False
                    )
                )

        if department_id:
            query = query.where(Document.department_id == str(department_id))
        if status:
            query = query.where(Document.status == status)
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_document_with_chunks(self, document_id: str, current_user: Optional[User] = None) -> Document:
        """Retrieves a document with parsed chunks eagerly loaded, checking DocumentPolicy authorization."""
        query = (
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.id == str(document_id))
        )
        result = await self.db.execute(query)
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")

        if current_user:
            from app.core.access.policy import document_policy
            document_policy.authorize_read(current_user, doc, resource_name="Document")

        return doc

    async def delete_document(
        self,
        document_id: str,
        user_id: str,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = None,
    ) -> bool:
        """Deletes a document, enforcing DocumentPolicy write/delete authorization."""
        query = select(Document).where(Document.id == str(document_id))
        res = await self.db.execute(query)
        doc = res.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")

        if current_user:
            from app.core.access.policy import document_policy
            document_policy.authorize_delete(current_user, doc, resource_name="Document")

        # Delete from disk/storage
        try:
            await storage_provider.delete_file(doc.file_path)
        except Exception as exc:
            logger.warning(f"Could not delete storage file {doc.file_path}: {exc}")

        # Delete vectors from ChromaDB
        try:
            from app.modules.retrieval.chroma_store import get_vector_store
            get_vector_store().delete_document_chunks(str(document_id))
        except Exception as chroma_exc:
            logger.warning(f"ChromaDB vector delete warning: {chroma_exc}")

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

    async def update_lifecycle(
        self,
        document_id: str,
        lifecycle_status: str,
        version: Optional[str] = None,
        superseded_by_id: Optional[str] = None,
        user_id: Optional[str] = None,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = None,
    ) -> Document:
        """Updates the lifecycle status and version relationships, enforcing DocumentPolicy write authorization."""
        valid_statuses = {"active", "superseded", "archived", "draft"}
        if lifecycle_status not in valid_statuses:
            raise ValidationError(f"Invalid lifecycle status '{lifecycle_status}'. Allowed: {valid_statuses}")

        query = select(Document).where(Document.id == str(document_id))
        res = await self.db.execute(query)
        doc = res.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")

        if current_user:
            from app.core.access.policy import document_policy
            document_policy.authorize_write(current_user, doc, resource_name="Document")

        doc.lifecycle_status = lifecycle_status
        if version:
            doc.version = version
        if superseded_by_id:
            doc.superseded_by_id = superseded_by_id

        await self.db.commit()
        await self.db.refresh(doc)

        # Audit lifecycle update
        try:
            await AuditService.log_event(
                self.db,
                AuditEventCreate(
                    user_id=str(user_id) if user_id else str(doc.uploader_id),
                    action="document.lifecycle_updated",
                    resource_type="document",
                    resource_id=str(document_id),
                    status="SUCCESS",
                    details={
                        "filename": doc.filename,
                        "new_status": lifecycle_status,
                        "version": doc.version,
                        "superseded_by_id": doc.superseded_by_id
                    },
                    ip_address=ip_address,
                ),
            )
        except Exception as audit_exc:
            logger.warning(f"Failed to log lifecycle audit: {audit_exc}")
        return doc

    async def list_pending_documents(
        self,
        department_id: Optional[str] = None
    ) -> List[Document]:
        """Lists all documents awaiting human approval."""
        query = (
            select(Document)
            .where(Document.approval_status == "pending_approval")
            .order_by(Document.created_at.desc())
        )
        if department_id:
            query = query.where(Document.department_id == str(department_id))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def review_document_approval(
        self,
        document_id: str,
        decision: str,  # "approved" or "rejected"
        reviewer_id: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Document:
        """Processes an HOD / Admin approval or rejection decision."""
        if decision not in {"approved", "rejected"}:
            raise ValidationError(f"Invalid decision '{decision}'. Allowed: 'approved', 'rejected'")

        from datetime import datetime, timezone
        query = select(Document).options(selectinload(Document.chunks)).where(Document.id == str(document_id))
        res = await self.db.execute(query)
        doc = res.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document with ID {document_id} not found")

        doc.approval_status = decision
        doc.approved_by_id = str(reviewer_id)
        doc.approval_notes = notes
        doc.approved_at = datetime.now(timezone.utc)

        if decision == "approved":
            doc.lifecycle_status = "active"
            # Sync vectors into ChromaDB embedded store upon approval
            try:
                from app.modules.retrieval.chroma_store import get_vector_store
                chroma_chunks = []
                for chunk_obj in doc.chunks:
                    meta = chunk_obj.metadata_.copy() if chunk_obj.metadata_ else {}
                    meta.update({
                        "document_id": doc.id,
                        "document_title": doc.title,
                        "document_filename": doc.filename,
                        "department_id": str(doc.department_id),
                        "lifecycle_status": doc.lifecycle_status,
                        "version": doc.version,
                        "chunk_index": chunk_obj.chunk_index,
                        "page_number": meta.get("page_number", 1)
                    })
                    chroma_chunks.append({
                        "id": str(chunk_obj.id),
                        "content": chunk_obj.content,
                        "metadata": meta
                    })
                get_vector_store().upsert_chunks(chroma_chunks)
            except Exception as chroma_exc:
                logger.warning(f"ChromaDB sync on approval warning: {chroma_exc}")
        else:
            # If rejected, ensure vectors are purged if any were indexed
            try:
                from app.modules.retrieval.chroma_store import get_vector_store
                get_vector_store().delete_document_chunks(str(doc.id))
            except Exception:
                pass

        await self.db.commit()
        await self.db.refresh(doc)

        # Audit event
        try:
            await AuditService.log_event(
                self.db,
                AuditEventCreate(
                    user_id=str(reviewer_id),
                    action=f"document.{decision}",
                    resource_type="document",
                    resource_id=str(document_id),
                    status="SUCCESS",
                    details={
                        "filename": doc.filename,
                        "decision": decision,
                        "notes": notes,
                    },
                    ip_address=ip_address,
                ),
            )
        except Exception as audit_exc:
            logger.warning(f"Failed to log approval audit: {audit_exc}")

        return doc

