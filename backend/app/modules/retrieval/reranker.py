"""Cross-Encoder Re-Ranking using FlashRank for high-precision semantic scoring."""
import time
from typing import List, Dict, Any, Optional
from app.core.logging import logger


class CrossEncoderReranker:
    """
    Lightweight, ultra-fast Cross-Encoder Re-Ranker powered by FlashRank (ONNX).
    Scores the true contextual relevance between (query, document) pairs.
    """

    def __init__(self, model_name: str = "ms-marco-TinyBERT-L-2-v2"):
        self.model_name = model_name
        self._ranker = None
        self._available = True

    def _get_ranker(self):
        if self._ranker is None and self._available:
            try:
                from flashrank import Ranker
                # FlashRank caches the tiny 4MB model locally in user cache
                self._ranker = Ranker(model_name=self.model_name, cache_dir="./data/flashrank_cache")
                logger.info(f"Initialized FlashRank Cross-Encoder with model='{self.model_name}'")
            except Exception as exc:
                logger.warning(f"Could not initialize FlashRank ({exc}). Falling back to rank-preservation.")
                self._available = False
        return self._ranker

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Re-ranks a list of candidate chunk dictionaries based on deep cross-attention.
        Preserves original fields and updates 'score' to the cross-encoder relevance score.
        """
        if not candidates or len(candidates) <= 1:
            return candidates[:top_k]

        ranker = self._get_ranker()
        if ranker is None:
            # Fallback if flashrank is not available
            return candidates[:top_k]

        try:
            from flashrank import RerankRequest

            start = time.perf_counter()
            # Prepare payloads for FlashRank: list of dicts with id and text
            passages = [
                {"id": idx, "text": c.get("content", "")}
                for idx, c in enumerate(candidates)
            ]

            request = RerankRequest(query=query, passages=passages)
            results = ranker.rerank(request)
            duration_ms = (time.perf_counter() - start) * 1000.0

            reranked_candidates = []
            for item in results:
                idx = item["id"]
                orig = dict(candidates[idx])
                # FlashRank score is typically [0, 1] cross-entropy logit
                orig["score"] = round(float(item.get("score", orig.get("score", 0.0))), 4)
                orig["reranked"] = True
                reranked_candidates.append(orig)

            logger.info(f"FlashRank reranked {len(candidates)} candidates in {duration_ms:.2f}ms")
            return reranked_candidates[:top_k]

        except Exception as exc:
            logger.warning(f"FlashRank rerank failed ({exc}). Falling back to input ranking.")
            return candidates[:top_k]


_reranker_instance = None


def get_reranker() -> CrossEncoderReranker:
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = CrossEncoderReranker()
    return _reranker_instance
