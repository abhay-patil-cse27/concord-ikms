"""Concrete LLM providers: Groq Cloud API and Local Offline Template Fallback."""
import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.modules.retrieval.llm_base import BaseLLMProvider


GROUNDED_SYSTEM_PROMPT = """You are CONCORD, the intelligent and verified AI Assistant for Kolhapur Institute of Technology (KIT).

COMMUNICATION STYLE & TONE:
1. Speak naturally, coherently, and conversationally in fluent English, just like a helpful, articulate human expert.
2. Formulate clear, well-structured, natural paragraphs with bullet points where appropriate, explaining concepts directly and helpfully.
3. If the user is simply greeting you (e.g., "Hi", "Hello", "How are you?"), greet them warmly and conversationally as CONCORD and invite them to ask about academic regulations, curricula, or institutional policies. Do not force an evidence retrieval answer onto pure greetings.

STRICT GROUNDING & FACTUAL INTEGRITY (ZERO HALLUCINATION):
1. For informational inquiries, rely EXCLUSIVELY on the verified Institutional Evidence extracts provided in the user prompt.
2. NEVER invent, extrapolate, assume, or fabricate any rules, deadlines, percentages, criteria, course names, or circular IDs that are not explicitly stated in the evidence.
3. If the user's question asks for specific institutional facts that are NOT in the evidence, state politely and naturally:
   "According to the official institutional records currently available, there is no specific information regarding this query."
4. Attribute every factual statement or regulation to its source by placing clean bracket citations like [1], [2] at the end of the relevant sentence.
5. CONFLICT & CONTRADICTION: If retrieved evidence contains conflicting rules from different document versions (e.g. passing marks or fee rules differ between revisions), clearly explain both versions:
   "⚠️ Institutional Version Discrepancy: Evidence [X] states [Rule 1], whereas Evidence [Y] specifies [Rule 2]."
6. SUPERSEDED RECORDS: If drawing from a superseded or archived source, note it gently:
   "*(Note: Derived from archived/superseded institutional record [X].)*"
"""


CONVERSATIONAL_SYSTEM_PROMPT = """You are CONCORD, the intelligent and welcoming AI assistant for the Kolhapur Institute of Technology (KIT) Institutional Knowledge Management System (IKMS).

ROLE & PERSONALITY:
- Be warm, articulate, helpful, and professional in natural conversational English.
- The user is having a casual conversation, asking a greeting (e.g. "hi", "hello"), asking who you are, or asking how you can help.
- Explain your purpose: You help students, faculty, and administrators find verified institutional policies, academic syllabi, grading ordinances, curriculum structures, and departmental circulars with zero hallucination.
- Guide the user with 2-3 brief examples of specific questions they can ask (e.g. "What is the minimum attendance requirement?", "Tell me about the DevOps lab syllabus", or "Compare R20 and R22 examination rules").
- Keep your tone conversational and inviting. Do NOT include bracket citations like [1] or pretend to quote specific rule numbers unless asked for specific documents.
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

    async def generate_conversational_answer(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Direct conversational response without querying RAG database."""
        if not self.api_key:
            return OfflineFallbackLLMProvider().conversational_synthesize(query)

        messages = [
            {"role": "system", "content": system_prompt or CONVERSATIONAL_SYSTEM_PROMPT}
        ]
        if conversation_history:
            # Include up to the last 4 turns for context
            for msg in conversation_history[-4:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": query})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 512,
            "top_p": 0.9,
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
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
                    answer_text = data["choices"][0]["message"]["content"].strip()
                    import re
                    answer_text = re.sub(r'<br\s*/?>', '\n', answer_text, flags=re.IGNORECASE)
                    return {
                        "answer": answer_text,
                        "citations": [],
                        "confidence": "high",
                        "model_used": f"groq:{self.model}"
                    }
                else:
                    logger.warning(f"Groq Cloud API conversational call returned {res.status_code}: {res.text}")
                    return OfflineFallbackLLMProvider().conversational_synthesize(query)

        except Exception as exc:
            logger.error(f"Groq API conversational call failed: {exc}")
            return OfflineFallbackLLMProvider().conversational_synthesize(query)

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

            doc_lifecycle = chunk.get("lifecycle_status", "active")
            doc_version = chunk.get("version", "v1.0")
            freshness = chunk.get("freshness", "current" if doc_lifecycle == "active" else doc_lifecycle)

            evidence_text += f"\n[Evidence {idx}] (Document: {doc_title}, Version: {doc_version}, Status: {doc_lifecycle}, Page: {page_no}):\n{content}\n"
            citations_metadata.append({
                "citation_index": idx,
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "document_title": doc_title,
                "document_filename": chunk.get("document_filename"),
                "page_number": page_no,
                "snippet": content[:180] + "..." if len(content) > 180 else content,
                "score": chunk.get("score"),
                "lifecycle_status": doc_lifecycle,
                "version": doc_version,
                "freshness": freshness,
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
                    # Clean out raw HTML break tags (<br>, <br/>, <br />) that degrade markdown rendering
                    answer_text = re.sub(r'<br\s*/?>', '\n', answer_text, flags=re.IGNORECASE)
                    # Clean repeated blank lines
                    answer_text = re.sub(r'\n{3,}', '\n\n', answer_text).strip()
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

    async def stream_grounded_tokens(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ):
        """Streams LLM tokens chunk by chunk using Groq Cloud API."""
        if not evidence_chunks:
            yield "No relevant institutional documents found within your authorized scope to answer this query."
            return

        evidence_text = ""
        for idx, chunk in enumerate(evidence_chunks, start=1):
            doc_title = chunk.get("document_title", "Institutional Record")
            page_no = chunk.get("page_number", 1)
            content = chunk.get("content", "").strip()
            doc_lifecycle = chunk.get("lifecycle_status", "active")
            doc_version = chunk.get("version", "v1.0")
            evidence_text += f"\n[Evidence {idx}] (Document: {doc_title}, Version: {doc_version}, Status: {doc_lifecycle}, Page: {page_no}):\n{content}\n"

        user_content = f"Question: {query}\n\nVerified Institutional Evidence:\n{evidence_text}\n\nPlease formulate an authoritative, grounded answer citing [1], [2], etc.:"

        if not self.api_key:
            res = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, [])
            yield res.get("answer", "")
            return

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt or GROUNDED_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "top_p": 0.9,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream(
                    "POST",
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, [])
                        yield fallback.get("answer", "")
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        line = line.strip()
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_json = json.loads(data_str)
                                delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                            except Exception:
                                continue
        except Exception as exc:
            logger.error(f"Groq API streaming failed: {exc}. Falling back to non-streaming fallback.")
            fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, [])
            yield fallback.get("answer", "")



class OfflineFallbackLLMProvider(BaseLLMProvider):
    """
    Deterministic evidence extraction synthesizer when running offline or without an active Groq API key.
    Extracts relevant statements directly from top-ranked chunks with proper citations.
    """

    async def generate_grounded_answer(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        citations = []
        for idx, chunk in enumerate(evidence_chunks, start=1):
            citations.append({
                "citation_index": idx,
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "document_title": chunk.get("document_title", "Institutional Record"),
                "page_number": chunk.get("page_number", 1),
                "snippet": chunk.get("content", "")[:180],
                "score": chunk.get("score"),
                "lifecycle_status": chunk.get("lifecycle_status", "active"),
                "version": chunk.get("version", "v1.0"),
                "freshness": "current"
            })
        return self.synthesize(query, evidence_chunks, citations)

    async def generate_conversational_answer(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.conversational_synthesize(query)

    def conversational_synthesize(self, query: str) -> Dict[str, Any]:
        return {
            "answer": (
                "Hello! I am CONCORD, your Institutional Knowledge Assistant for Kolhapur Institute of Technology.\n\n"
                "I can assist you with:\n"
                "• Academic regulations, curricula, and course syllabi\n"
                "• Examination policies, grading, and attendance criteria\n"
                "• Departmental circulars and institutional notifications\n\n"
                "What would you like to explore today?"
            ),
            "citations": [],
            "confidence": "high",
            "model_used": "offline_conversational"
        }

    def synthesize(self, query: str, evidence_chunks: List[Dict[str, Any]], citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not evidence_chunks:
            return {
                "answer": "No relevant institutional documents found within your authorized scope.",
                "citations": [],
                "confidence": "insufficient_evidence",
                "model_used": "offline_synthesizer"
            }
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

