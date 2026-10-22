"""Hybrid retrieval and Reciprocal Rank Fusion algorithms."""
import math
import re
from typing import List, Dict, Any, Tuple


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two float vectors. Assumes L2 normalized vectors."""
    if len(vec_a) != len(vec_b) or not vec_a:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    return max(0.0, min(1.0, float(dot)))


def compute_lexical_score(query: str, text: str) -> float:
    """
    Compute a normalized BM25-style lexical matching score between query and document text.
    Handles exact phrase matches, token frequency, and length penalty.
    """
    if not query or not text:
        return 0.0

    q_tokens = re.findall(r"\w+", query.lower())
    if not q_tokens:
        return 0.0

    t_tokens = re.findall(r"\w+", text.lower())
    if not t_tokens:
        return 0.0

    # Token frequencies in target
    freqs: Dict[str, int] = {}
    for t in t_tokens:
        freqs[t] = freqs.get(t, 0) + 1

    doc_len = len(t_tokens)
    k1 = 1.2
    b = 0.75
    avg_len = 100.0

    score = 0.0
    matched_tokens = 0

    for q in q_tokens:
        tf = freqs.get(q, 0)
        if tf > 0:
            matched_tokens += 1
            # Term saturation formula
            term_score = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / avg_len)))
            score += term_score

    # Exact full-phrase bonus
    if query.strip().lower() in text.lower():
        score += 3.0

    # Coverage multiplier (incentivize queries matching multiple terms)
    coverage = matched_tokens / len(q_tokens)
    score *= coverage

    return round(score, 4)


def reciprocal_rank_fusion(
    lexical_rankings: List[Dict[str, Any]],
    vector_rankings: List[Dict[str, Any]],
    k: int = 60,
    top_n: int = 10
) -> List[Dict[str, Any]]:
    """
    Combine multiple ranked candidate lists using standard Reciprocal Rank Fusion (RRF).
    
    Formula: RRF_Score(d) = sum(1 / (k + rank(d)))
    """
    scores: Dict[str, float] = {}
    doc_registry: Dict[str, Dict[str, Any]] = {}
    lex_ranks: Dict[str, int] = {}
    vec_ranks: Dict[str, int] = {}

    # Index lexical candidates
    for rank, item in enumerate(lexical_rankings, start=1):
        c_id = item["chunk_id"]
        doc_registry[c_id] = item
        lex_ranks[c_id] = rank
        scores[c_id] = scores.get(c_id, 0.0) + (1.0 / (k + rank))

    # Index vector candidates
    for rank, item in enumerate(vector_rankings, start=1):
        c_id = item["chunk_id"]
        if c_id not in doc_registry:
            doc_registry[c_id] = item
        vec_ranks[c_id] = rank
        scores[c_id] = scores.get(c_id, 0.0) + (1.0 / (k + rank))

    # Sort combined results descending by RRF score
    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

    results = []
    for rank, c_id in enumerate(sorted_ids[:top_n], start=1):
        data = dict(doc_registry[c_id])
        data["rrf_score"] = round(scores[c_id], 6)
        data["rank"] = rank
        data["lexical_rank"] = lex_ranks.get(c_id)
        data["vector_rank"] = vec_ranks.get(c_id)
        results.append(data)

    return results
