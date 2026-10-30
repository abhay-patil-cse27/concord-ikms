"""Abstract contract for LLM inference providers."""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMProvider(ABC):
    """Abstract Strategy interface for Large Language Model generation."""

    @abstractmethod
    async def generate_grounded_answer(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a verifiable answer grounded strictly in the provided evidence chunks.
        
        Must return:
        - answer: str (the formatted response with inline citations e.g. [1], [2])
        - citations: list of dicts referencing the source chunk IDs, documents, and page numbers
        - confidence: str ('high', 'medium', 'insufficient_evidence')
        - model_used: str
        """
        pass

    @abstractmethod
    async def generate_conversational_answer(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a direct, warm, conversational response for greetings, general inquiries,
        and pleasantries without querying the vector index.
        
        Must return:
        - answer: str
        - citations: list (empty for conversational responses)
        - confidence: str ('high')
        - model_used: str
        """
        pass

    async def stream_grounded_tokens(
        self,
        query: str,
        evidence_chunks: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ):
        """
        Yields tokens in real-time for grounded generation.
        Default implementation yields the full answer as a single chunk if streaming not supported.
        """
        result = await self.generate_grounded_answer(query, evidence_chunks, system_prompt)
        yield result.get("answer", "")

    async def stream_conversational_tokens(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ):
        """
        Yields tokens in real-time for direct conversational generation.
        Default implementation yields the full answer as a single chunk if streaming not supported.
        """
        result = await self.generate_conversational_answer(query, conversation_history, system_prompt)
        yield result.get("answer", "")

