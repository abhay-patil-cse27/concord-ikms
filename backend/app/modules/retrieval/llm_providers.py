"""Concrete LLM providers: Groq Cloud API, Local/Remote OpenAI-Compatible Node, and Offline Synthesizer."""
import re
import json
import httpx
from typing import List, Dict, Any, Optional, Tuple, AsyncIterator
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


# ==============================================================================
# Shared Helper Functions (Eliminating Redundancy across All LLM Providers)
# ==============================================================================

def _build_evidence_context(evidence_chunks: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Transforms raw evidence chunks into a formatted institutional evidence text string
    and standard citation metadata list with numbered indices [1], [2], etc.
    """
    evidence_text = ""
    citations_metadata = []

    for idx, chunk in enumerate(evidence_chunks, start=1):
        doc_title = chunk.get("document_title", "Institutional Record")
        page_no = chunk.get("page_number", 1)
        content = chunk.get("content", "").strip()

        doc_lifecycle = chunk.get("lifecycle_status", "active")
        doc_version = chunk.get("version", "v1.0")
        freshness = chunk.get("freshness", "current" if doc_lifecycle == "active" else doc_lifecycle)

        evidence_text += (
            f"\n[Evidence {idx}] (Document: {doc_title}, Version: {doc_version}, "
            f"Status: {doc_lifecycle}, Page: {page_no}):\n{content}\n"
        )
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

    return evidence_text, citations_metadata


def _build_chat_payload(
    model: str,
    system_prompt: str,
    user_content: str,
    temperature: float = 0.1,
    max_tokens: int = 1024,
    stream: bool = False,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Constructs a standard OpenAI-compatible chat completion payload."""
    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for msg in conversation_history[-4:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_content})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
    }
    if stream:
        payload["stream"] = True
    return payload


def _clean_llm_response(text: str) -> str:
    """Normalizes citations (e.g. 【1】 -> [1]), strips raw HTML, and consolidates blank lines."""
    if not text:
        return ""
    text = re.sub(r'【(\d+)】', r'[\1]', text)
    text = re.sub(r'\[Evidence\s*(\d+)\]', r'[\1]', text, flags=re.IGNORECASE)
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _parse_sse_delta(line: str) -> Tuple[Optional[str], bool]:
    """
    Parses a single Server-Sent Events (SSE) data line into (token, is_done).
    Returns (None, True) when '[DONE]' sentinel is encountered.
    """
    if not line:
        return None, False
    line = line.strip()
    if not line.startswith("data: "):
        return None, False
    data_str = line[6:].strip()
    if data_str == "[DONE]":
        return None, True
    try:
        chunk_json = json.loads(data_str)
        delta = chunk_json.get("choices", [{}])[0].get("delta", {})
        token = delta.get("content", "")
        return (token if token else None), False
    except Exception:
        return None, False


# ==============================================================================
# Providers
# ==============================================================================

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

        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or CONVERSATIONAL_SYSTEM_PROMPT,
            user_content=query,
            temperature=0.6,
            max_tokens=512,
            conversation_history=conversation_history
        )

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
                    answer_text = data["choices"][0]["message"]["content"]
                    return {
                        "answer": _clean_llm_response(answer_text),
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

        evidence_text, citations_metadata = _build_evidence_context(evidence_chunks)
        user_content = (
            f"Question: {query}\n\n"
            f"Verified Institutional Evidence:\n{evidence_text}\n\n"
            f"Please formulate an authoritative, grounded answer citing [1], [2], etc.:"
        )

        if not self.api_key:
            return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)

        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or GROUNDED_SYSTEM_PROMPT,
            user_content=user_content,
            temperature=0.1,
            max_tokens=1024
        )

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
                    return {
                        "answer": _clean_llm_response(answer_text),
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

        evidence_text, citations_metadata = _build_evidence_context(evidence_chunks)
        user_content = (
            f"Question: {query}\n\n"
            f"Verified Institutional Evidence:\n{evidence_text}\n\n"
            f"Please formulate an authoritative, grounded answer citing [1], [2], etc.:"
        )

        if not self.api_key:
            res = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
            yield res.get("answer", "")
            return

        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or GROUNDED_SYSTEM_PROMPT,
            user_content=user_content,
            temperature=0.1,
            max_tokens=1024,
            stream=True
        )

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
                        fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
                        yield fallback.get("answer", "")
                        return

                    async for line in response.aiter_lines():
                        token, is_done = _parse_sse_delta(line)
                        if is_done:
                            break
                        if token:
                            yield token
        except Exception as exc:
            logger.error(f"Groq API streaming failed: {exc}. Falling back to non-streaming fallback.")
            fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
            yield fallback.get("answer", "")


class LocalLLMProvider(BaseLLMProvider):
    """
    Decoupled, deployment-ready provider for Local and Remote OpenAI-compatible inference nodes.
    Supports Ollama, vLLM, LM Studio, LocalAI, or any remote server via LAN, tunnel, or internet.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        api_key: Optional[str] = None
    ):
        raw_url = (base_url or settings.LOCAL_LLM_URL).rstrip("/")
        # Normalize endpoint to /v1/chat/completions (supports passing either base origin or /v1)
        if raw_url.endswith("/v1/chat/completions"):
            self.endpoint = raw_url
        elif raw_url.endswith("/v1"):
            self.endpoint = f"{raw_url}/chat/completions"
        else:
            self.endpoint = f"{raw_url}/v1/chat/completions"

        self.model = model or settings.LOCAL_LLM_MODEL
        self.timeout = timeout or settings.LOCAL_LLM_TIMEOUT_SECONDS
        self.api_key = api_key or ""

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def generate_conversational_answer(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Conversational response via local/remote inference node."""
        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or CONVERSATIONAL_SYSTEM_PROMPT,
            user_content=query,
            temperature=0.6,
            max_tokens=512,
            conversation_history=conversation_history
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(self.endpoint, headers=self._get_headers(), json=payload)
                if res.status_code == 200:
                    data = res.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    return {
                        "answer": _clean_llm_response(answer_text),
                        "citations": [],
                        "confidence": "high",
                        "model_used": f"local:{self.model}"
                    }
                else:
                    logger.warning(f"Local LLM node responded with HTTP {res.status_code}: {res.text}")
                    return OfflineFallbackLLMProvider().conversational_synthesize(query)
        except Exception as exc:
            logger.error(f"Local LLM node conversational request failed: {exc}")
            return OfflineFallbackLLMProvider().conversational_synthesize(query)

    async def generate_grounded_answer(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Grounded QA via local/remote inference node (temperature clamped to 0.05 for anti-hallucination)."""
        if not evidence_chunks:
            return {
                "answer": "No relevant institutional documents found within your authorized scope to answer this query.",
                "citations": [],
                "confidence": "insufficient_evidence",
                "model_used": "direct_refusal"
            }

        evidence_text, citations_metadata = _build_evidence_context(evidence_chunks)
        user_content = (
            f"Question: {query}\n\n"
            f"Verified Institutional Evidence:\n{evidence_text}\n\n"
            f"Please formulate an authoritative, grounded answer citing [1], [2], etc.:"
        )

        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or GROUNDED_SYSTEM_PROMPT,
            user_content=user_content,
            temperature=0.05,  # Anti-hallucination clamp for smaller models
            max_tokens=1024
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(self.endpoint, headers=self._get_headers(), json=payload)
                if res.status_code == 200:
                    data = res.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    return {
                        "answer": _clean_llm_response(answer_text),
                        "citations": citations_metadata,
                        "confidence": "high",
                        "model_used": f"local:{self.model}"
                    }
                else:
                    logger.warning(f"Local LLM node responded with HTTP {res.status_code}: {res.text}. Falling back to synthesizer.")
                    return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
        except Exception as exc:
            logger.error(f"Local LLM node request failed: {exc}. Utilizing offline fallback.")
            return OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)

    async def stream_grounded_tokens(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ):
        """Streams grounded tokens chunk-by-chunk from local or remote node."""
        if not evidence_chunks:
            yield "No relevant institutional documents found within your authorized scope to answer this query."
            return

        evidence_text, citations_metadata = _build_evidence_context(evidence_chunks)
        user_content = (
            f"Question: {query}\n\n"
            f"Verified Institutional Evidence:\n{evidence_text}\n\n"
            f"Please formulate an authoritative, grounded answer citing [1], [2], etc.:"
        )

        payload = _build_chat_payload(
            model=self.model,
            system_prompt=system_prompt or GROUNDED_SYSTEM_PROMPT,
            user_content=user_content,
            temperature=0.05,
            max_tokens=1024,
            stream=True
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    self.endpoint,
                    headers=self._get_headers(),
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
                        yield fallback.get("answer", "")
                        return

                    async for line in response.aiter_lines():
                        token, is_done = _parse_sse_delta(line)
                        if is_done:
                            break
                        if token:
                            yield token
        except Exception as exc:
            logger.error(f"Local LLM node streaming failed: {exc}. Falling back to non-streaming synthesizer.")
            fallback = OfflineFallbackLLMProvider().synthesize(query, evidence_chunks, citations_metadata)
            yield fallback.get("answer", "")


class OfflineFallbackLLMProvider(BaseLLMProvider):
    """
    Deterministic evidence extraction synthesizer when running offline or without an active LLM provider.
    Extracts relevant statements directly from top-ranked chunks with proper citations.
    """

    async def generate_grounded_answer(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        _, citations = _build_evidence_context(evidence_chunks)
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
            f"*(Generated via verified evidence extraction fallback)*"
        )

        return {
            "answer": answer,
            "citations": citations,
            "confidence": "medium",
            "model_used": "offline_synthesizer"
        }


# ==============================================================================
# Dynamic Runtime State & Factory
# ==============================================================================

# In-memory runtime override (allows Admin toggle without restarting server process)
_RUNTIME_LLM_CONFIG: Dict[str, Any] = {
    "provider_mode": None,   # When None, defaults to settings.LLM_PROVIDER_MODE
    "local_url": None,        # When None, defaults to settings.LOCAL_LLM_URL
    "local_model": None,      # When None, defaults to settings.LOCAL_LLM_MODEL
}


def get_runtime_llm_config() -> Dict[str, Any]:
    """Retrieves current effective LLM configuration."""
    return {
        "provider_mode": _RUNTIME_LLM_CONFIG["provider_mode"] or settings.LLM_PROVIDER_MODE,
        "local_url": _RUNTIME_LLM_CONFIG["local_url"] or settings.LOCAL_LLM_URL,
        "local_model": _RUNTIME_LLM_CONFIG["local_model"] or settings.LOCAL_LLM_MODEL,
        "groq_model": settings.GROQ_MODEL,
        "has_groq_key": bool(settings.GROQ_API_KEY),
    }


def set_runtime_llm_config(
    provider_mode: Optional[str] = None,
    local_url: Optional[str] = None,
    local_model: Optional[str] = None
) -> Dict[str, Any]:
    """Updates runtime LLM configuration hot-swapped across all active RAG services."""
    if provider_mode is not None:
        if provider_mode not in ("cloud", "local"):
            raise ValueError("provider_mode must be 'cloud' or 'local'")
        _RUNTIME_LLM_CONFIG["provider_mode"] = provider_mode
    if local_url is not None:
        _RUNTIME_LLM_CONFIG["local_url"] = local_url.strip()
    if local_model is not None:
        _RUNTIME_LLM_CONFIG["local_model"] = local_model.strip()
    return get_runtime_llm_config()


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory resolving active LLM provider dynamically.
    Checks runtime state first, fallback to environment configuration.
    """
    cfg = get_runtime_llm_config()
    mode = cfg.get("provider_mode", "cloud")

    if mode == "local":
        return LocalLLMProvider(
            base_url=cfg["local_url"],
            model=cfg["local_model"]
        )
    return GroqCloudLLMProvider()
