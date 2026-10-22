"""Retrieval domain service executing RBAC-scoped hybrid search."""
import time
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.documents.models import Document, DocumentChunk
from app.modules.identity.models import User
from app.modules.retrieval.base import BaseEmbeddingProvider
from app.modules.retrieval.embeddings import get_default_embedding_provider
from app.modules.retrieval.fusion import (
    compute_cosine_similarity,
    compute_lexical_score,
    reciprocal_rank_fusion
)
from app.modules.retrieval.schemas import SearchEvidenceItem, SearchQueryResponse


class RetrievalService:
    """
    Enterprise Retrieval Service delivering authorized, multi-stage hybrid search.
    Strictly enforces department boundaries based on user identity.
    """

    def __init__(self, embedding_provider: Optional[BaseEmbeddingProvider] = None):
        self.embedding_provider = embedding_provider or get_default_embedding_provider()

    async def search(
        self,
        db: AsyncSession,
        query: str,
        current_user: User,
        top_k: int = 5,
        target_department_id: Optional[str] = None,
        mode: str = "hybrid"
    ) -> SearchQueryResponse:
        start_time = time.perf_counter()

        # 1. Resolve authorized department scope
        # Global platform admin can access all departments.
        # Other personas are strictly restricted to their assigned department.
        user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
        is_global_admin = "platform_admin" in user_roles

        allowed_dept_id: Optional[str] = None
        if not is_global_admin:
            # Enforce user's assigned department
            allowed_dept_id = current_user.department_id
        elif target_department_id:
            allowed_dept_id = target_department_id

        # 2. Fetch accessible active documents and chunks
        stmt = (
            select(DocumentChunk)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Document.status == "processed")
            .options(selectinload(DocumentChunk.document))
        )

        if allowed_dept_id:
            stmt = stmt.where(Document.department_id == allowed_dept_id)

        result = await db.execute(stmt)
        chunks: List[DocumentChunk] = result.scalars().all()

        if not chunks:
            latency = (time.perf_counter() - start_time) * 1000.0
            return SearchQueryResponse(
                query=query,
                total_candidates=0,
                retrieval_mode=mode,
                latency_ms=round(latency, 2),
                results=[]
            )

        # 3. Candidate evaluation
        query_vector = self.embedding_provider.embed_text(query)

        lexical_candidates: List[Dict[str, Any]] = []
        vector_candidates: List[Dict[str, Any]] = []

        for chunk in chunks:
            doc = chunk.document
            meta = chunk.metadata_ or {}
            page_no = meta.get("page_number", 1)

            base_item = {
                "chunk_id": chunk.id,
                "document_id": doc.id,
                "document_title": doc.title,
                "document_filename": doc.filename,
                "department_id": doc.department_id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "page_number": page_no,
                "char_count": chunk.char_count,
                "metadata": meta
            }

            # Lexical scoring
            lex_score = compute_lexical_score(query, chunk.content)
            if lex_score > 0.0:
                item_lex = dict(base_item)
                item_lex["score"] = lex_score
                lexical_candidates.append(item_lex)

            # Vector scoring
            chunk_vector = self.embedding_provider.embed_text(chunk.content)
            vec_score = compute_cosine_similarity(query_vector, chunk_vector)
            if vec_score > 0.0:
                item_vec = dict(base_item)
                item_vec["score"] = vec_score
                vector_candidates.append(item_vec)

        # Sort candidate lists
        lexical_candidates.sort(key=lambda x: x["score"], reverse=True)
        vector_candidates.sort(key=lambda x: x["score"], reverse=True)

        # 4. Fusion / Mode routing
        final_items: List[SearchEvidenceItem] = []

        if mode == "lexical":
            for rank, item in enumerate(lexical_candidates[:top_k], start=1):
                item["rank"] = rank
                final_items.append(SearchEvidenceItem(**item))
        elif mode == "vector":
            for rank, item in enumerate(vector_candidates[:top_k], start=1):
                item["rank"] = rank
                final_items.append(SearchEvidenceItem(**item))
        else:
            # Default: Hybrid Reciprocal Rank Fusion
            fused = reciprocal_rank_fusion(lexical_candidates, vector_candidates, k=60, top_n=top_k)
            for item in fused:
                item["score"] = item["rrf_score"]
                final_items.append(SearchEvidenceItem(**item))

        latency = (time.perf_counter() - start_time) * 1000.0

        return SearchQueryResponse(
            query=query,
            total_candidates=len(chunks),
            retrieval_mode=mode,
            latency_ms=round(latency, 2),
            results=final_items
        )
