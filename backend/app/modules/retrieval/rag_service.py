"""RAG domain service orchestrating grounded generation with citations."""
import time
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.models import User
from app.modules.retrieval.service import RetrievalService
from app.modules.retrieval.llm_base import BaseLLMProvider
from app.modules.retrieval.llm_providers import get_llm_provider
from app.modules.retrieval.schemas import RAGAskRequest, RAGAskResponse, CitationItem


class RAGService:
    """
    Orchestrates the entire grounded RAG pipeline:
    1. Authorized candidate retrieval (RBAC-scoped via RetrievalService).
    2. Context assembly with citation references.
    3. LLM synthesis via Groq Cloud (with offline fallback).
    4. Structured response envelope with citations and confidence metrics.
    """

    def __init__(
        self,
        retrieval_service: Optional[RetrievalService] = None,
        llm_provider: Optional[BaseLLMProvider] = None,
    ):
        self.retrieval_service = retrieval_service or RetrievalService()
        self.llm_provider = llm_provider or get_llm_provider()

    async def ask(
        self,
        db: AsyncSession,
        request: RAGAskRequest,
        current_user: User
    ) -> RAGAskResponse:
        start_time = time.perf_counter()

        # Step 0: Check if query requires multi-step comparative research
        from app.modules.workflows.research_agent import ComparativeResearchAgent
        comp_agent = ComparativeResearchAgent(self.retrieval_service, self.llm_provider)

        if comp_agent.is_comparative_query(request.query):
            comp_res = await comp_agent.execute_research(
                db=db,
                query=request.query,
                current_user=current_user,
                target_department_id=request.department_id
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            citations = [CitationItem(**c) for c in comp_res.get("citations", [])]
            return RAGAskResponse(
                query=request.query,
                answer=comp_res.get("answer", ""),
                citations=citations,
                confidence=comp_res.get("confidence", "high"),
                model_used=comp_res.get("model_used", "groq:comparative_agent"),
                latency_ms=round(latency_ms, 2),
                retrieval_mode="multi_step_comparative"
            )

        # Step 1: Execute authorized hybrid search to get verified evidence
        # By default (include_superseded=False), search only active current-policy documents.
        lifecycle_filter = "all" if request.include_superseded else "active"

        search_res = await self.retrieval_service.search(
            db=db,
            query=request.query,
            current_user=current_user,
            top_k=request.top_k,
            target_department_id=request.department_id,
            mode="hybrid",
            lifecycle_status=lifecycle_filter
        )

        evidence_chunks = [item.model_dump() for item in search_res.results]

        # Step 2: Delegate generation to LLM provider
        llm_output = await self.llm_provider.generate_grounded_answer(
            query=request.query,
            evidence_chunks=evidence_chunks
        )

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        # Step 3: Format response envelope
        citations = [CitationItem(**c) for c in llm_output.get("citations", [])]

        return RAGAskResponse(
            query=request.query,
            answer=llm_output.get("answer", ""),
            citations=citations,
            confidence=llm_output.get("confidence", "medium"),
            model_used=llm_output.get("model_used", "unknown"),
            latency_ms=round(latency_ms, 2),
            retrieval_mode="hybrid_rrf"
        )
