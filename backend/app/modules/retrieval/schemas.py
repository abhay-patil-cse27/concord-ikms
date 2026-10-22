"""Schemas for search requests and structured response envelopes."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SearchQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Natural language question or keyword query")
    department_id: Optional[str] = Field(None, description="Optional target department filter")
    top_k: int = Field(5, ge=1, le=25, description="Maximum number of evidence chunks to retrieve")
    mode: str = Field("hybrid", description="Retrieval mode: 'hybrid', 'vector', or 'lexical'")
    lifecycle_status: Optional[str] = Field("active", description="Filter by lifecycle status: 'active', 'superseded', 'archived', or 'all'")


class SearchEvidenceItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    document_filename: str
    department_id: str
    chunk_index: int
    content: str
    page_number: Optional[int] = 1
    char_count: int
    score: float
    rank: int
    lifecycle_status: str = "active"
    version: str = "v1.0"
    freshness: str = "current"  # current, superseded, archived
    lexical_rank: Optional[int] = None
    vector_rank: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchQueryResponse(BaseModel):
    query: str
    total_candidates: int
    retrieval_mode: str
    latency_ms: float
    results: List[SearchEvidenceItem]


# ==============================================================================
# Milestone 4: Grounded RAG Schemas
# ==============================================================================

class RAGAskRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Natural language question")
    department_id: Optional[str] = Field(None, description="Optional target department scope")
    top_k: int = Field(5, ge=1, le=10, description="Maximum number of evidence sources to ground against")
    include_superseded: bool = Field(False, description="Whether to include superseded/archived records for historical auditing")


class CitationItem(BaseModel):
    citation_index: int
    chunk_id: str
    document_id: str
    document_title: str
    document_filename: str
    page_number: Optional[int] = 1
    snippet: str
    score: Optional[float] = None
    lifecycle_status: str = "active"
    version: str = "v1.0"
    freshness: str = "current"


class RAGAskResponse(BaseModel):
    query: str
    answer: str
    citations: List[CitationItem]
    confidence: str
    model_used: str
    latency_ms: float
    retrieval_mode: str = "hybrid_rrf"
