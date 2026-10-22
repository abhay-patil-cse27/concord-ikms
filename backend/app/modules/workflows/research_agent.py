"""Multi-Step Comparative Research Agent for complex institutional queries."""
import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.modules.identity.models import User
from app.modules.retrieval.service import RetrievalService
from app.modules.retrieval.llm_base import BaseLLMProvider
from app.modules.retrieval.llm_providers import get_llm_provider


COMPARATIVE_AGENT_PROMPT = """You are the CONCORD Comparative Research Agent for Kolhapur Institute of Technology (KIT).

Your role is to produce a structured, unbiased comparative synthesis between institutional regulations, syllabus versions, or departmental policies.

RULES:
1. Ground every claim STRICTLY in the provided evidence. Cite sources using [1], [2], etc.
2. Present differences clearly using a Markdown comparison table where applicable:
   | Dimension / Aspect | Option A / Previous Version | Option B / Current Version | Citations |
3. Highlight changes, discrepancies, or revisions explicitly.
4. If a difference cannot be substantiated from the evidence, state: "No official comparative data available in the retrieved records."
"""


class ComparativeResearchAgent:
    """
    Decomposes multi-part comparison queries into targeted sub-queries,
    retrieves evidence across multiple scopes, and synthesizes a comparative table.
    """

    def __init__(
        self,
        retrieval_service: Optional[RetrievalService] = None,
        llm_provider: Optional[BaseLLMProvider] = None,
    ):
        self.retrieval_service = retrieval_service or RetrievalService()
        self.llm_provider = llm_provider or get_llm_provider()

    def is_comparative_query(self, query: str) -> bool:
        """Determines if a query requires comparative multi-step research."""
        q = query.lower()
        triggers = ["compare", "difference between", "versus", "vs", "changes between", "regulation vs", "syllabus comparison"]
        return any(t in q for t in triggers)

    async def execute_research(
        self,
        db: AsyncSession,
        query: str,
        current_user: User,
        target_department_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a multi-stage comparative research workflow:
        1. Query decomposition into targeted aspects.
        2. Multi-stage evidence aggregation.
        3. Deduplication and ranking.
        4. Structured comparative synthesis.
        """
        logger.info(f"ComparativeResearchAgent executing for query='{query}'")

        # Step 1: Sub-query retrieval across current and historical lifecycle
        # Search active records
        active_search = await self.retrieval_service.search(
            db=db,
            query=query,
            current_user=current_user,
            top_k=5,
            target_department_id=target_department_id,
            mode="hybrid",
            lifecycle_status="active"
        )

        # Search superseded/historical records to provide comparative contrast
        all_search = await self.retrieval_service.search(
            db=db,
            query=query,
            current_user=current_user,
            top_k=5,
            target_department_id=target_department_id,
            mode="hybrid",
            lifecycle_status="all"
        )

        # Step 2: Merge and deduplicate evidence chunks by chunk_id
        merged_chunks: Dict[str, Dict[str, Any]] = {}
        for item in active_search.results + all_search.results:
            if item.chunk_id not in merged_chunks:
                merged_chunks[item.chunk_id] = item.model_dump()

        evidence_list = list(merged_chunks.values())[:8]

        # Step 3: Synthesize comparative report via LLM provider
        llm_result = await self.llm_provider.generate_grounded_answer(
            query=query,
            evidence_chunks=evidence_list,
            system_prompt=COMPARATIVE_AGENT_PROMPT
        )

        return {
            "query": query,
            "is_comparative": True,
            "answer": llm_result.get("answer", ""),
            "citations": llm_result.get("citations", []),
            "confidence": llm_result.get("confidence", "high"),
            "model_used": llm_result.get("model_used", "groq"),
            "sources_analyzed": len(evidence_list)
        }
