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

## Future Milestones
- **M4 (Grounded RAG & Verifiable Answers):** Evidence citation validation, grounded prompt execution, hallucination prevention.
- **M5 (Trust & Institutional Memory):** Versioning, conflict detection, freshness badges, superseded notice flags.
- **M6 (Agent Workflows):** Human-in-the-loop approval workflows with LangGraph.
- **M7 (Evaluation & Hardening):** Retrieval benchmarks (Hit Rate, MRR), security verification (OWASP ASVS).
- **M8 (Deployment & Demonstration):** End-to-end multi-department institutional scenario demonstration.

