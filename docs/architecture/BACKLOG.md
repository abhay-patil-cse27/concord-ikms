# CONCORD — Prioritized Engineering Backlog

## Milestone 0: Discovery, Architecture & Baseline (Completed)
- [x] Repository assessment and environment audit.
- [x] System architecture design (Modular Monolith, Presentation, API, Data Layer).
- [x] Initial relational data model & seed role definition.
- [x] Module dependency map and structural boundaries.
- [x] Risk register and mitigations.
- [x] Architecture Decision Records (ADR-0001 through ADR-0004).

## Milestone 1: Platform Foundation (Target Slice)
- [x] **Backend Core:**
  - [x] Configuration management via Pydantic Settings (`.env` support).
  - [x] Structured JSON logging & correlation IDs (`X-Request-ID`).
  - [x] Centralized error handling & standard error envelope.
  - [x] Database engine with async SQLAlchemy 2.0 & Alembic migrations.
  - [x] Health checks (`/healthz`, `/readyz`).
- [x] **Identity & RBAC:**
  - [x] Password hashing with argon2 / bcrypt.
  - [x] JWT token generation and authentication middleware.
  - [x] Role-Based Access Control guards (`require_permission`, `require_role`).
  - [x] Pre-seeded demo accounts (Platform Admin, Dept Admin, Faculty, Student) for fast evaluation.
  - [x] Security audit event logging engine.
- [x] **Frontend Shell:**
  - [x] React + Vite application with modern dark-mode institutional design.
  - [x] Live system health inspection.
  - [x] Role-based login and demo user quick-switcher.
  - [x] Protected dashboard routes displaying current user identity, role, department, and granted permissions.
  - [x] Department and audit log overview screen.
- [x] **DevOps & Verification:**
  - [x] `docker-compose.yml` for PostgreSQL 16 + pgvector and MinIO.
  - [x] `.env.example` with documented configurations.
  - [x] Comprehensive pytest test suite covering health, auth, RBAC guards, and unauthorized rejection.
  - [x] Verification scripts and clear run instructions.

## Milestone 2: Document Ingestion, Parsing & Chunking Engine (Completed)
- [x] **Multi-format Ingestion Pipeline:**
  - [x] Storage abstraction (`BaseStorageProvider` & `LocalStorageProvider`).
  - [x] PDF text extractor with `pypdf`.
  - [x] Word document (`.docx`) extractor with `python-docx`.
  - [x] Excel spreadsheet extractor (`.xlsx`, `.xls`) with `openpyxl` multi-sheet parsing.
  - [x] Plain text, markdown, CSV, and code file extraction.
- [x] **Format-Aware Chunking Strategies:**
  - [x] `TabularChunker`: Row-aware batching for Excel/CSV preserving column header context across all chunks.
  - [x] `SemanticParagraphChunker`: Paragraph and heading hierarchy boundary splitting for DOCX/Markdown.
  - [x] `SlidingWindowTextChunker`: Boundary-aware sliding window with sentence snapping for PDFs/TXT.
  - [x] Factory routing via `get_chunker_for_document(filename, mime_type)`.
  - [x] Content hashing (SHA-256) for departmental deduplication.
  - [x] Relational schemas for `Document` and `DocumentChunk` with cascade lifecycle.
- [x] **API & Security:**
  - [x] Multipart upload endpoint (`POST /api/v1/documents/upload`).
  - [x] Document listing, chunk inspection, raw file download, and deletion endpoints.
  - [x] Server-enforced RBAC guards (`documents:read`, `documents:write`, `documents:delete`).
  - [x] Security audit event logging on upload and deletion.
- [x] **Frontend Management Interface:**
  - [x] Interactive Documents View with live department filtering.
  - [x] Multi-format upload modal with real-time feedback and validation (`.xlsx, .pdf, .docx, .txt, .csv`).
  - [x] Chunk inspector modal displaying extracted segments, character counts, and page metadata.
  - [x] Raw document file download and deletion actions.
- [x] **Verification & Test Suite:**
  - [x] Parser unit tests for PDF, DOCX, TXT, and Excel extraction (`tests/test_parsers.py`).
  - [x] Chunking strategy unit tests (`test_tabular_chunker`, `test_chunker_sliding_window`, `test_chunker_factory`).
  - [x] Document lifecycle and RBAC rejection integration tests (`tests/test_documents.py`).

## Milestone 3: Hybrid Search & Retrieval Engine (Completed)
- [x] **Architecture & Component Reusability Standards:**
  - [x] Implement `BaseEmbeddingProvider` strategy pattern (`DeterministicHashEmbeddingProvider` for offline testing, expandable to neural embeddings).
  - [x] Build reusable query pipeline: preprocessing, department-scoped RBAC filter application, and candidate fusion.
- [x] **Hybrid Retrieval & Fusion Engine:**
  - [x] Multi-stage retrieval combining full-text keyword search and vector cosine similarity.
  - [x] Reciprocal Rank Fusion (RRF) to merge keyword and semantic hit scores without score distortion: $\text{RRF}(d) = \sum \frac{1}{60 + \text{rank}(d)}$.
  - [x] Token-bounded context selection and evidence ranking.
- [x] **Search API & Access Enforcement:**
  - [x] Versioned endpoint: `POST /api/v1/search/query`.
  - [x] Automatic department scope injection from authenticated user context (students/faculty restricted to their own department + global docs).
  - [x] Standardized search response envelopes with full source citations, chunk IDs, and similarity metrics.
- [x] **Frontend Reusable UI & Visual Polish:**
  - [x] Institutional Landing Page (`LandingView.jsx`) with smooth transitions and hero showcase.
  - [x] Dedicated Contextual Search & Query View (`frontend/src/views/SearchView.jsx`).
  - [x] Reusable UI component primitives: `SearchBar`, `FilterPills`, `EvidenceCitationCard`, `ThemeToggle`.
  - [x] Custom hook `useSearch` to encapsulate debounce, error handling, and query state.
  - [x] High-contrast Light Mode default with seamless Dark Mode toggle.
- [x] **Verification & Benchmarking:**
  - [x] Unit tests for RRF algorithm, embedding providers, and search query filters (`tests/test_retrieval.py`).
  - [x] RBAC integration tests ensuring cross-department document leakage is impossible.
  - [x] Complete test suite passing: 30/30 tests.

## Milestone 4: Grounded RAG & Verifiable Answers (Completed)
- [x] **LLM Integration & Provider Strategy:**
  - [x] Abstract provider contract `BaseLLMProvider`.
  - [x] Ultra-fast Groq Cloud API integration (`llama-3.3-70b-versatile`).
  - [x] Fail-safe offline deterministic synthesizer fallback (`OfflineFallbackLLMProvider`).
  - [x] Strict institutional prompt engineering: answer *only* from verified evidence, mandate inline citations `[1]`, refuse if information is absent.
- [x] **RAG Domain Service & API:**
  - [x] `RAGService` connecting department-scoped `RetrievalService` with LLM provider.
  - [x] Versioned endpoint: `POST /api/v1/rag/ask` with RBAC guard `require_permission("documents:read")`.
  - [x] Audit trail recording query metrics, latency, model used, and citation counts.
- [x] **Frontend Institutional Q&A Interface:**
  - [x] Reusable `RAGAssistantView.jsx` and `useRAG` custom hook.
  - [x] Interactive inline citation tags (`[1]`, `[2]`) in generated answers.
  - [x] Citation Inspector slide-over drawer showing document filename, title, page number, and original chunk snippet.
  - [x] Sidebar navigation with active role scoping and responsive light/dark themes.
- [x] **Automated Tests:**
  - [x] Pytest suite covering offline fallback, empty evidence refusal, RAG API, and unauthorized rejections (`tests/test_rag.py`).
  - [x] Full test suite passing (34/34 tests).

## Phase 4b: Embedded Local Vector Store (ChromaDB Integration) (Completed)
- [x] **ChromaDB Core Architecture & Lifecycle:**
  - [x] Add `chromadb` to `backend/requirements.txt` and define persistent storage directory at `backend/data/chroma`.
  - [x] Implement `ChromaVectorStore` utilizing embedded `PersistentClient` with native metadata filtering.
- [x] **Ingestion Sync & Deduplication:**
  - [x] Hook into Document Ingestion pipeline (`backend/app/modules/documents/service.py`) to automatically upsert chunks and metadata (`document_id`, `department_id`, `chunk_index`, `page_number`) into ChromaDB collection.
  - [x] Implement atomic deletion hook so deleting a document also purges all associated chunk vectors from ChromaDB (`collection.delete(where={"document_id": doc_id})`).
- [x] **Hardware/Index-Level RBAC Filtering in Hybrid Search:**
  - [x] Update `RetrievalService` to query ChromaDB with `where={"department_id": user_dept_id}` (or unrestricted for `platform_admin`), offloading vector similarity search from Python in-memory math to Chroma's HNSW vector index.
  - [x] Preserve Reciprocal Rank Fusion (RRF) combining ChromaDB semantic search hits with lexical BM25 hits.
- [x] **Verification & Benchmarks:**
  - [x] Automated tests in `backend/tests/test_chroma.py` verifying vector persistence, index retrieval, metadata filtering, and document deletion cascades.
  - [x] Validate zero-downtime execution and verify offline capability without external daemon processes.

## Phase 4c: Optimal RAG Architecture & Algorithmic Hardening (Completed)
- [x] **Academic Query Preprocessing & Acronym Expansion:**
  - [x] Implement `AcademicQueryNormalizer` in `backend/app/modules/retrieval/normalizer.py`.
  - [x] Correct common typographical errors (*"syallbus"*, *"devpos"*, *"curriculam"*).
  - [x] Expand academic and syllabus acronyms (*"bda"*, *"cns"*, *"nep"*, *"co/po"*, *"devops"*).
- [x] **Unified Neural Transformer Semantic Embeddings:**
  - [x] Implement `NeuralONNXEmbeddingProvider` generating 384-dimensional dense semantic vectors using `all-MiniLM-L6-v2` ONNX transformer runtime.
  - [x] Standardize in-memory candidate retrieval and ChromaDB HNSW indexing on the exact same neural semantic vector space.
- [x] **FlashRank Cross-Encoder Re-Ranking Stage:**
  - [x] Integrate `flashrank` (`ms-marco-TinyBERT-L-2-v2`) in `backend/app/modules/retrieval/reranker.py`.
  - [x] Re-score top-15 hybrid RRF candidates with full query-document cross-attention in ~10ms on CPU, pushing highest-fidelity evidence to Rank 1.
- [x] **Verification & Suite Expansion:**
  - [x] Add unit tests for query normalization, acronym expansion, and cross-encoder re-ranking in `backend/tests/test_retrieval.py`.
  - [x] Full test suite passing with 39/39 tests (`pytest backend/tests`).

## Milestone 5: Trust, Freshness & Institutional Memory (Completed)
- [x] **Step 5.1: Document Versioning & Lifecycle Schema:**
  - [x] Add `lifecycle_status` (`active`, `superseded`, `archived`, `draft`) to `Document` model.
  - [x] Add versioning metadata (`version`, `effective_date`, `expiration_date`, `superseded_by_id`).
  - [x] Implement `PATCH /api/v1/documents/{document_id}/lifecycle` endpoint with permission guards.
  - [x] Integrate lifecycle state into ChromaDB ingestion sync metadata.
  - [x] Integration tests for lifecycle transitions and version tracking (`backend/tests/test_documents.py`).
- [x] **Step 5.2: Freshness & Lifecycle Filtering in RAG Search:**
  - [x] Default hybrid search to `lifecycle_status="active"`.
  - [x] Support `include_superseded` flag in `RAGAskRequest` and `lifecycle_status` in `SearchQueryRequest`.
  - [x] Attach freshness metadata (`current`, `superseded`, `archived`) to evidence items and citations.
  - [x] Unit test `test_search_lifecycle_filtering` verifying superseded policy exclusion (`backend/tests/test_retrieval.py`).
- [x] **Step 5.3: Automated Contradiction & Conflict Detection:**
  - [x] Multi-version conflict detection rule injected into system prompt (`GROUNDED_SYSTEM_PROMPT`).
  - [x] Explicit discrepancy report formatting mandate preventing hallucinated rule blending.
- [x] **Step 5.4: Frontend Trust Badges & Warning UI:**
  - [x] Freshness badges (🟢 CURRENT `v1.0`, 🔴 SUPERSEDED) embedded in Citation Inspector slide-over drawer.
  - [x] Superseded policy disclaimer notice banner in Grounded Q&A answers.


## Future Milestones
- **M6 (Agent Workflows):** Human-in-the-loop approval workflows with LangGraph.
- **M7 (Evaluation & Hardening):** Retrieval benchmarks (Hit Rate, MRR), security verification (OWASP ASVS).
- **M8 (Deployment & Demonstration):** End-to-end multi-department institutional scenario demonstration.



