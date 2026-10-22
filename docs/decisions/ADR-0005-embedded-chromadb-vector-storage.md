# ADR-0005: Dual-Tier Vector Storage with Embedded ChromaDB & PostgreSQL pgvector

## Status
Accepted

## Context
CONCORD requires both:
1. Fast, self-contained local development and CI testing that operates offline without requiring Docker containers or external cloud vector databases.
2. Index-level Role-Based Access Control (RBAC) filtering (`department_id`, user boundaries) to prevent unauthorized cross-department semantic search leakage.
3. Production containerized scaling capabilities with relational ACID guarantees.

## Decision
- **Local Embedded Vector Store:** Integrate **ChromaDB** using its `PersistentClient` targeting `backend/data/chroma`.
  - Performs HNSW cosine similarity vector indexing locally.
  - Supports native metadata pre-filtering (`where={"department_id": user_dept_id}`) to enforce RBAC boundaries at the index level.
  - Synchronizes automatically during document ingestion and cascade deletion.
- **Production Vector Store:** Support **PostgreSQL 16 + pgvector** via SQLAlchemy when running in containerized production environments.
- **Hybrid Fusion:** Blend vector semantic scores with BM25 lexical scores using Reciprocal Rank Fusion (RRF) before forwarding evidence chunks to the Groq Cloud LLM provider (`llama-3.3-70b-versatile`).

## Consequences
- **Positive:**
  - Zero required background services for local development or viva demonstrations.
  - Sub-second vector similarity retrieval with hardware/index-level department scoping.
  - Clean separation of concerns between relational metadata (`Document`, `DocumentChunk`) in SQLite/PostgreSQL and dense vectors in ChromaDB/pgvector.
- **Negative:**
  - Requires maintaining ChromaDB synchronization hooks on document upload and deletion in `DocumentService`.
