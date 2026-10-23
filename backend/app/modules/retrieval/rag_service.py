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

    def is_conversational_query(self, query: str) -> bool:
        """
        Classifies whether user query is a greeting, pleasantry, or general AI assistant capability query.
        If true, the system responds naturally and warmly without querying the vector index.
        """
        import re
        q = query.strip().lower()

        # Direct short match or regex patterns
        exact_phrases = {
            "hi", "hello", "hey", "hola", "namaste", "good morning", "good afternoon",
            "good evening", "how are you", "who are you", "what can you do", "help",
            "what is your name", "who made you", "thank you", "thanks", "bye", "goodbye"
        }
        if q in exact_phrases or q.rstrip("?.!") in exact_phrases:
            return True

        # Regex patterns for greetings or self-introduction inquiries
        patterns = [
            r"^(hi|hello|hey|greetings|howdy)\b",
            r"^who are you\b",
            r"^what can you (do|help with)\b",
            r"^how (can|do) you help\b",
            r"^tell me about yourself\b",
            r"^what is concord\b",
            r"^(thanks|thank you)\b"
        ]
        return any(re.search(pat, q) for pat in patterns)

    async def ask(
        self,
        db: AsyncSession,
        request: RAGAskRequest,
        current_user: User
    ) -> RAGAskResponse:
        start_time = time.perf_counter()

        # Step 0a: Conversational / Greeting Router (Healthy Conversational Agent)
        # Avoids triggering ChromaDB / RAG search on generic chatter
        if self.is_conversational_query(request.query):
            conv_output = await self.llm_provider.generate_conversational_answer(
                query=request.query
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return RAGAskResponse(
                query=request.query,
                answer=conv_output.get("answer", ""),
                citations=[],
                confidence="high",
                model_used=conv_output.get("model_used", "groq:conversational"),
                latency_ms=round(latency_ms, 2),
                retrieval_mode="direct_conversational"
            )

        # Step 0b: Check if query requires multi-step comparative research
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
