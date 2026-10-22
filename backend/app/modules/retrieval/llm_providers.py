"""Concrete LLM providers: Groq Cloud API and Local Offline Template Fallback."""
import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.modules.retrieval.llm_base import BaseLLMProvider


GROUNDED_SYSTEM_PROMPT = """You are CONCORD, the verified Institutional Intelligence Assistant for Kolhapur Institute of Technology (KIT).

CRITICAL GROUNDING RULES:
1. Answer the user's inquiry STRICTLY and ONLY using the provided verified evidence extracts below.
2. If the provided extracts do NOT contain enough information to answer truthfully, state clearly:
   "The official institutional records currently available do not contain guidelines regarding this query."
3. NEVER speculate, extrapolate, or invent deadlines, circular IDs, rules, or percentages.
4. Always cite your sources using inline bracket citations like [1], [2] corresponding to the Evidence number.
5. Format your response cleanly with clear bullet points and bold headers where appropriate.
"""


class GroqCloudLLMProvider(BaseLLMProvider):
    """
    Production-grade LLM provider powered by Groq Cloud ultra-fast inference (Llama 3.3 70B / 8B).
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key
        self._model = model
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def api_key(self) -> str:
        return self._api_key or settings.GROQ_API_KEY

    @property
    def model(self) -> str:
        return self._model or settings.GROQ_MODEL

    async def generate_grounded_answer(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        if not evidence_chunks:
            return {
                "answer": "No relevant institutional documents found within your authorized scope to answer this query.",
                "citations": [],
                "confidence": "insufficient_evidence",
                "model_used": "direct_refusal"
            }

        # Build numbered evidence context
        evidence_text = ""
        citations_metadata = []

        for idx, chunk in enumerate(evidence_chunks, start=1):
            doc_title = chunk.get("document_title", "Institutional Record")
            page_no = chunk.get("page_number", 1)
            content = chunk.get("content", "").strip()

            evidence_text += f"\n[Evidence {idx}] (Document: {doc_title}, Page: {page_no}):\n{content}\n"
            citations_metadata.append({
                "citation_index": idx,
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "document_title": doc_title,
                "document_filename": chunk.get("document_filename"),
                "page_number": page_no,
                "snippet": content[:180] + "..." if len(content) > 180 else content,
                "score": chunk.get("score")
            })

        user_content = f"Question: {query}\n\nVerified Institutional Evidence:\n{evidence_text}\n\nPlease formulate an authoritative, grounded answer citing [1], [2], etc.:"

        # If no API key configured, use the Offline Deterministic Synthesizer fallback
        if not self.api_key:
            return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt or GROUNDED_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "top_p": 0.9,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

                if res.status_code == 200:
                    data = res.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    # Normalize special unicode brackets (e.g. 【1】 or [Evidence 1] -> [1]) so citations parse cleanly
                    import re
                    answer_text = re.sub(r'【(\d+)】', r'[\1]', answer_text)
                    answer_text = re.sub(r'\[Evidence\s*(\d+)\]', r'[\1]', answer_text, flags=re.IGNORECASE)
                    return {
                        "answer": answer_text,
                        "citations": citations_metadata,
                        "confidence": "high",
                        "model_used": f"groq:{self.model}"
                    }
                else:
                    logger.warning(f"Groq Cloud API responded with {res.status_code}: {res.text}. Utilizing fallback synthesis.")
                    return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)

        except Exception as exc:
            logger.error(f"Groq API call failed: {exc}. Utilizing offline fallback.")
            return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)


class OfflineFallbackLLMProvider:
    """
    Deterministic evidence extraction synthesizer when running offline or without an active Groq API key.
    Extracts relevant statements directly from top-ranked chunks with proper citations.
    """

    def synthesize(self, query: str, evidence_chunks: List[Dict[str, Any]], citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        top_chunk = evidence_chunks[0]
        paragraphs = [p.strip() for p in top_chunk.get("content", "").split("\n") if p.strip()]

        summary_points = "\n".join([f"• {p} [1]" for p in paragraphs[:4]])

        answer = (
            f"Based on official institutional records ({top_chunk.get('document_title')}, Page {top_chunk.get('page_number', 1)}):\n\n"
            f"{summary_points}\n\n"
            f"*(Generated via verified evidence extraction. To activate generative reasoning with Llama 3.3, add your free GROQ_API_KEY in .env)*"
        )

        return {
            "answer": answer,
            "citations": citations,
            "confidence": "medium",
            "model_used": "offline_synthesizer"
        }


def get_llm_provider() -> BaseLLMProvider:
    """Factory resolving the active LLM provider."""
    return GroqCloudLLMProvider()
