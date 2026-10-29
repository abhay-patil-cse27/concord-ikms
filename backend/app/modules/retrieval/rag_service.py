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
        self._llm_provider = llm_provider

    @property
    def llm_provider(self) -> BaseLLMProvider:
        return self._llm_provider or get_llm_provider()

    def is_conversational_query(self, query: str) -> bool:
        """
        Classifies whether user query is a greeting, pleasantry, or general AI assistant capability query.
        If true, the system responds naturally and warmly without querying the vector index or emitting citations.
        """
        import re
        q = query.strip().lower()
        q_clean = re.sub(r'^[^\w]+|[^\w]+$', '', q)

        # Guard: If query contains explicit institutional academic keywords, route directly to RAG
        academic_keywords = {
            "syllabus", "attendance", "curriculum", "regulation", "circular", "exam", "examination",
            "grade", "grading", "fee", "admission", "credit", "course", "ordinance", "department",
            "policy", "rule", "passing", "hall ticket", "revaluation", "criteria", "cgpa", "sgpa"
        }
        words = set(re.findall(r'\b\w+\b', q_clean))
        if words & academic_keywords:
            return False

        # Direct exact matches & conversational phrases (with punctuation stripped)
        exact_phrases = {
            "hi", "hii", "hiii", "hello", "helloo", "hellooo", "hey", "heyy", "heyyy",
            "hallo", "hallooo", "hola", "namaste", "howdy", "yo", "sup", "greetings",
            "good morning", "good afternoon", "good evening", "good night",
            "how are you", "how are you doing", "how r u", "what's up", "whats up",
            "who are you", "what are you", "who made you", "what is your name", "who r u",
            "what can you do", "what do you do", "how can you help", "how do you help",
            "help", "help me", "can you help me", "tell me about yourself",
            "what is concord", "what is ikms", "about you",
            "thank you", "thanks", "thanks a lot", "thx", "bye", "goodbye", "cya",
            "ok", "okay", "cool", "nice", "awesome", "great"
        }
        if q in exact_phrases or q_clean in exact_phrases:
            return True

        # Regex patterns for greetings (supports repeated letters like hiii, heyyy, hallooo) and identity questions
        patterns = [
            r"^(h+i+|h+e+y+|h+e+l+l+o+|h+a+l+l+o+|howdy|greetings|yo+|sup)\b",
            r"^(who|what) (are|r) you\b",
            r"^what (can|do) you (do|help with)\b",
            r"^how (can|do) you help\b",
            r"^(tell me|explain) (about yourself|who you are)\b",
            r"^what is (concord|ikms)\b",
            r"^(thanks|thank you|thx)\b",
            r"^(help me|can you help)\b"
        ]
        return any(re.search(pat, q_clean) for pat in patterns)

    async def ask(
        self,
        db: AsyncSession,
        request: RAGAskRequest,
        current_user: User
    ) -> RAGAskResponse:
        start_time = time.perf_counter()

        # Step 0: Input Guardrail & Safety Interceptor
        from app.core.guardrails import PromptGuard

        sanitized_query = PromptGuard.sanitize_input(request.query)
        is_safe, refusal_reason = PromptGuard.check_prompt_safety(sanitized_query)
        if not is_safe:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return RAGAskResponse(
                query=sanitized_query,
                answer=PromptGuard.STANDARD_REFUSAL_MESSAGE,
                citations=[],
                confidence="none",
                model_used="guardrail:blocked",
                latency_ms=round(latency_ms, 2),
                retrieval_mode="blocked_by_guardrail"
            )

        # Update request query to clean sanitized query
        request.query = sanitized_query

        # Step 0a: Conversational / Greeting Router (Healthy Conversational Agent)
        # Avoids triggering ChromaDB / RAG search on generic chatter
        if self.is_conversational_query(request.query):
            conv_output = await self.llm_provider.generate_conversational_answer(
                query=request.query
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            safe_answer = PromptGuard.sanitize_output(conv_output.get("answer", ""))
            return RAGAskResponse(
                query=request.query,
                answer=safe_answer,
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

        safe_answer = PromptGuard.sanitize_output(llm_output.get("answer", ""))
        return RAGAskResponse(
            query=request.query,
            answer=safe_answer,
            citations=citations,
            confidence=llm_output.get("confidence", "medium"),
            model_used=llm_output.get("model_used", "unknown"),
            latency_ms=round(latency_ms, 2),
            retrieval_mode="hybrid_rrf"
        )
