"""Abstract interfaces and models for embedding providers."""
from abc import ABC, abstractmethod
from typing import List


class BaseEmbeddingProvider(ABC):
    """Abstract Strategy contract for generating dense text vector representations."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimensionality produced by this embedding provider."""
        pass

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a normalized dense float vector for a single text string."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate normalized dense float vectors for a batch of text strings."""
        pass
