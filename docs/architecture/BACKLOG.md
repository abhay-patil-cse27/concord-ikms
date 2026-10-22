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
  - [x] Plain text, markdown, and code file extraction.
- [x] **Chunking & Storage:**
  - [x] Sliding-window semantic chunker with sentence/paragraph boundary detection and overlap.
  - [x] Content hashing (SHA-256) for departmental deduplication.
  - [x] Relational schemas for `Document` and `DocumentChunk` with cascade lifecycle.
- [x] **API & Security:**
  - [x] Multipart upload endpoint (`POST /api/v1/documents/upload`).
  - [x] Document listing, chunk inspection, raw file download, and deletion endpoints.
  - [x] Server-enforced RBAC guards (`documents:read`, `documents:write`, `documents:delete`).
  - [x] Security audit event logging on upload and deletion.
- [x] **Frontend Management Interface:**
  - [x] Interactive Documents View with live department filtering.
  - [x] Upload modal with real-time feedback and validation.
  - [x] Chunk inspector modal displaying extracted segments, character counts, and page metadata.
  - [x] Raw document file download and deletion actions.
- [x] **Verification & Test Suite:**
  - [x] Parser unit tests (`tests/test_parsers.py`).
  - [x] Document lifecycle and RBAC rejection integration tests (`tests/test_documents.py`).

## Milestone 3: Hybrid Search & Retrieval Engine (Next Target Slice)
- [ ] **Architecture & Component Reusability Standards:**
  - [ ] Implement `BaseEmbeddingProvider` strategy pattern (`LocalHashEmbedding` for offline testing, `SentenceTransformerEmbedding` / `OpenAIEmbedding` for production).
  - [ ] Implement swappable `BaseVectorStore` adapter (`SqliteVectorStore` / in-memory cosine fallback for local dev, `PgVectorStore` for production).
  - [ ] Build reusable query pipeline: preprocessing, department-scoped RBAC filter application, and candidate fusion.
- [ ] **Hybrid Retrieval & Fusion Engine:**
  - [ ] Multi-stage retrieval combining full-text keyword search and vector cosine similarity.
  - [ ] Reciprocal Rank Fusion (RRF) to merge keyword and semantic hit scores without score distortion.
  - [ ] Token-bounded context selection and evidence ranking.
- [ ] **Search API & Access Enforcement:**
  - [ ] Versioned endpoint: `POST /api/v1/search/query`.
  - [ ] Automatic department scope injection from authenticated user context (students/faculty restricted to their own department + global docs).
  - [ ] Standardized search response envelopes with full source citations, chunk IDs, and similarity metrics.
- [ ] **Frontend Reusable UI Components:**
  - [ ] Dedicated Search & Query View (`frontend/src/views/SearchView.jsx`).
  - [ ] Reusable UI component primitives: `SearchBar`, `FilterPills`, `EvidenceCitationCard`, `ScoreBadge`, and `LoadingSkeleton`.
  - [ ] Custom hook `useSearch` to encapsulate debounce, error handling, and query caching.
- [ ] **Verification & Benchmarking:**
  - [ ] Unit tests for RRF algorithm, embedding providers, and search query filters.
  - [ ] RBAC integration tests ensuring cross-department document leakage is impossible.

## Future Milestones
- **M4 (Grounded RAG & Verifiable Answers):** Evidence citation validation, grounded prompt execution, hallucination prevention.
- **M5 (Trust & Institutional Memory):** Versioning, conflict detection, freshness badges, superseded notice flags.
- **M6 (Agent Workflows):** Human-in-the-loop approval workflows with LangGraph.
- **M7 (Evaluation & Hardening):** Retrieval benchmarks (Hit Rate, MRR), security verification (OWASP ASVS).
- **M8 (Deployment & Demonstration):** End-to-end multi-department institutional scenario demonstration.

