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
