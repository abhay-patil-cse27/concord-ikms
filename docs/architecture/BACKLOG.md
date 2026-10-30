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
  - [x] Optical Character Recognition (OCR) adapter (`BaseOCRProvider`, `PytesseractOCRProvider`, `GracefulFallbackOCRProvider`) with automatic fallback on scanned pages.
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


## Milestone 6: Agent Workflows & Human-in-the-Loop Governance (Completed)
- [x] **Step 6.1: Document Governance & Approval Schema:**
  - [x] Add `approval_status` (`approved`, `pending_approval`, `rejected`), `approved_by_id`, `approval_notes`, and `approved_at` to `Document` model.
  - [x] Quarantined retrieval: unapproved documents are strictly excluded from search and RAG until verified.
- [x] **Step 6.2: Approval Queue & HOD Review Endpoints:**
  - [x] Implement `GET /api/v1/governance/pending-documents` review queue for HODs and Platform Admins.
  - [x] Implement `POST /api/v1/governance/documents/{id}/review` approval endpoint.
  - [x] Atomic ChromaDB sync: vectors are upserted into active collection upon approval and purged if rejected.
  - [x] Audit trail recording approval decisions and feedback notes.
- [x] **Step 6.3: Multi-Step Research & Comparative Query Agent:**
  - [x] Implement `ComparativeResearchAgent` in `backend/app/modules/workflows/research_agent.py`.
  - [x] Automated detection of comparative triggers (`vs`, `compare`, `difference between`).
  - [x] Multi-scope evidence gathering across current and historical records.
  - [x] Structured Markdown comparison tables with verifiable citations.
- [x] **Step 6.4: Verification & Suite Expansion:**
  - [x] Integration tests for governance approval workflow (`test_governance_approval_workflow`).
  - [x] Integration tests for comparative agent routing (`test_comparative_research_agent`).
  - [x] Full test suite passing with 43/43 tests (`pytest backend/tests`).

## Milestone 7: Evaluation, Benchmarking & Hardening (Completed)
- [x] **Step 7.1: Automated Evaluation & Empirical Metrics Engine:**
  - [x] Implement `EvaluationRunner` in `backend/app/modules/evaluation/runner.py`.
  - [x] Institutional ground-truth benchmark scenarios (exam rules, grading, credit requirements, CSE curriculum).
  - [x] Retrieval accuracy metrics calculation: `Hit Rate@K` (100% on CONCORD Hybrid) and `Mean Reciprocal Rank (MRR@K)` (1.000).
  - [x] Cross-department security isolation verification: 0.0% security leakage rate across RBAC boundaries.
  - [x] Latency benchmarking for ONNX neural embeddings, BM25, and FlashRank cross-encoder reranking.
- [x] **Step 7.2: Evaluation & Benchmarking API Endpoints:**
  - [x] Implement `GET /api/v1/evaluation/metrics` for comparative architecture baselines.
  - [x] Implement `POST /api/v1/evaluation/run` for on-demand live automated benchmark execution.
- [x] **Step 7.3: Frontend Evaluation & Benchmarking Dashboard:**
  - [x] Build `BenchmarkView.jsx` with KPI cards (Hit Rate@5, MRR@5, P95 Latency, Security Leakage).
  - [x] Comparative retrieval matrix table (BM25 Lexical vs ChromaDB Vector vs CONCORD Hybrid RRF + FlashRank).
  - [x] Live benchmark execution trigger with per-scenario rank breakdown and execution timings.
  - [x] Sidebar navigation link and full App.jsx routing integration.
- [x] **Step 7.4: Automated Test Suite Expansion:**
  - [x] Unit & integration tests in `backend/tests/test_evaluation.py` (`test_get_benchmark_metrics`, `test_run_live_benchmark`).
  - [x] Complete test suite passing: 45/45 tests (`pytest backend/tests`).

## Milestone 8: Multi-Department Institutional Demonstration & Viva Defense Readiness (Completed)
- [x] **Step 8.1: Pre-Seeding Rich Multi-Department Institutional Knowledge:**
  - [x] Create standalone seeding script `backend/scripts/seed_demo_data.py`.
  - [x] Embed canonical documents into DB seed: B.Tech CSE Autonomous Syllabus (2024–28), Exam Passing Regulations (2024), Superseded Regulations (2020), Computing Lab Safety & AI Ethics, and ENTC VLSI Lab Manual.
  - [x] Automated ChromaDB vector index synchronization across departments.
- [x] **Step 8.2: Interactive Evaluator Demo Mode & Prompt Presets:**
  - [x] Enhanced `RAGAssistantView.jsx` with canonical scenario pills (exam passing threshold, 2020 vs 2024 comparative analysis, CSE course credits, lab GPU ethics).
  - [x] Instant evaluator persona switcher pills (`Platform Admin`, `HOD CSE`, `Faculty`, `Student`).
- [x] **Step 8.3: Evaluator Defense & Presentation Guide:**
  - [x] Created `docs/VIVA_PRESENTATION_GUIDE.md` with 5-minute presentation script, architecture diagram, and deep technical defenses for anticipated viva questions.
- [x] **Step 8.4: Verification, Automated Tests & Packaging:**
  - [x] Integration tests for multi-department retrieval & superseded policy exclusion (`backend/tests/test_demo_scenarios.py`).
  - [x] Complete test suite passing: 47/47 tests (`pytest backend/tests`).
  - [x] Production build clean: `npm run build` succeeds in 2.9s.

## Milestone 9: Real-Time Streaming, Resilience, OCR & Security Hardening (Completed)
- [x] **Step 9.1: Real-Time Token Streaming (SSE):**
  - [x] Implemented `/api/v1/rag/ask-stream` with chunk-framing and zero-latency SSE token yield.
  - [x] Frontend dynamic typewriter with academic verb spinner and citation drawer integration.
- [x] **Step 9.2: Threat Modeling & ASVS 4.1 Security Hardening:**
  - [x] Multi-tiered `PromptGuard` interceptor blocking prompt injections, delimiter smuggling, and SQL injection signatures.
  - [x] OWASP ASVS HTTP headers, ChromaDB NoSQL injection neutralization, and path traversal stripping.
  - [x] Sliding-window token bucket AI rate limiting (`AIRateLimiterMiddleware`).
- [x] **Step 9.3: Asynchronous Non-Blocking Document Ingestion:**
  - [x] Implemented `POST /api/v1/documents/upload-async` and `GET /api/v1/documents/jobs/{job_id}`.
  - [x] 4-stage job progress polling (`queued` → `extracting` → `chunking` → `indexing` → `completed`).
- [x] **Step 9.4: Scanned Circular Layout-Aware OCR Preprocessor & Parser:**
  - [x] Implemented `ImagePreprocessor` with $1.5\times$ upscaling, contrast boost, and adaptive luminance binarization for faint institutional circular stamps.
  - [x] Created `ScannedImageParser` for `.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp`, `.webp`.
  - [x] Extended `UploadModal.jsx` drag-and-drop file inputs to accept scanned images.
- [x] **Step 9.5: Automated Verification & Documentation:**
  - [x] Unit test `test_scanned_image_preprocessor_and_parser` in `backend/tests/test_parsers.py`.
  - [x] 83 total automated tests (78 backend + 5 frontend) 100% passing.

## Milestone 10: Multimodal Accessibility, Batch Processing & Institutional Crawlers (Completed & Verified)
- [x] **Track 1: Natural Voice Readout & Speech Sanitization (TTS):**
  - [x] Web Speech API integration in `SpeechPlaybackButton.jsx` with real-time utterance queueing.
  - [x] Created `speechUtils.js` with regex-based normalization: strips bracket citations `[1], [2]`, markdown headers, bold/italic markers, and code blocks for smooth academic speech cadence.
  - [x] Frontend test suite `frontend/tests/speechUtils.test.js` passing 4/4 tests.
- [x] **Track 2: Web Notice URL Ingestion Crawler & SSRF Guard:**
  - [x] Implemented `crawl_web_notice_url` in `backend/app/modules/documents/web_crawler.py` with BeautifulSoup4 body extraction.
  - [x] Enterprise SSRF defense in `backend/app/core/network_guard.py`: DNS resolution, RFC-1918 private IP rejection, loopback blocking, cloud metadata (`169.254.169.254`) prevention, and HTTP/HTTPS scheme validation.
  - [x] Endpoints: `POST /api/v1/documents/ingest-url` and `POST /api/v1/documents/ingest-url-async`.
  - [x] Pytest suite `tests/test_web_ingestion.py` passing 2/2 tests.
- [x] **Track 3: Multi-File Batch Drag-and-Drop Ingestion:**
  - [x] Redesigned `UploadModal.jsx` to accept 5–10 files concurrently with multi-row itemized progress table.
  - [x] Asynchronous multi-item job queue execution against `/api/v1/documents/upload-async`.
  - [x] Verified batch queue stability with zero UI blocking.
- [x] **Track 4: Academic Dossier HTML Exporter:**
  - [x] Created `backend/app/modules/audit/dossier_exporter.py` generating self-contained institutional audit dossiers.
  - [x] Complete NAAC/NBA compliance accreditation exports with cryptographic timestamps, confidence scoring breakdown, and institutional masthead.
  - [x] Endpoint `GET /api/v1/audit/dossier/html` guarded by `audit:read`.
- [x] **Track 5: Yellow-Brutalist UI Polish & Layout Stability:**
  - [x] Resolved conflicting dual spinners in `BenchmarkHeader.jsx` by decoupling manual button loading state from child Lucide icon.
  - [x] Fixed `BenchmarkView.jsx` skeleton count props and implemented stale-while-revalidate data retention to eliminate layout shifts (FOUC).
  - [x] Verified full suite: 89/89 automated tests passing (80 backend + 9 frontend).

## Milestone 11: Dual-Mode LLM Engine (Cloud API vs On-Premises Local/Remote Node) (Completed & Verified)
- [x] **Step 11.1: Modular Zero-Redundancy Provider Layer:**
  - [x] Extracted shared helpers `_build_evidence_context`, `_build_chat_payload`, `_clean_llm_response`, `_parse_sse_delta` in `backend/app/modules/retrieval/llm_providers.py`.
  - [x] Implemented `LocalLLMProvider` targeting standard OpenAI-compatible `/v1/chat/completions` (Ollama, vLLM, LAN lab PC, or internet tunnels).
  - [x] Temperature clamped to 0.05 for strict anti-hallucination grounded extractive QA on smaller consumer models (`qwen2.5:1.5b`).
  - [x] Resilient offline error handling with automatic handoff to `OfflineFallbackLLMProvider`.
- [x] **Step 11.2: System Settings, CORS Regex & Dynamic Hot-Swapping Factory:**
  - [x] Added `LLM_PROVIDER_MODE`, `LOCAL_LLM_URL`, `LOCAL_LLM_MODEL`, `LOCAL_LLM_TIMEOUT_SECONDS`, and `CORS_ORIGIN_REGEX` to `config.py` and `main.py`.
  - [x] Dynamic runtime factory `get_llm_provider()` hot-swapping provider strategy in-memory without server restarts.
  - [x] Implemented `GET /api/v1/system/llm-config`, `PUT /api/v1/system/llm-config` (guarded by `platform_admin`), and `POST /api/v1/system/llm-test` (health probe).
  - [x] Registered `system_router` into `api_v1_router`.
- [x] **Step 11.3: Frontend Admin Control & Live Diagnostics Beacon:**
  - [x] Added `getLLMConfig()`, `updateLLMConfig()`, and `testLLMNode()` to `frontend/src/api/client.js`.
  - [x] Built Yellow-Brutalist `Dual-Mode LLM Engine Controller` in `DashboardView.jsx` with segmented toggle, node URL input, model tag picker, and live latency health beacon.
- [x] **Step 11.4: Automated Test Suite & Production Build Verification:**
  - [x] Authored `backend/tests/test_llm_providers.py` covering modular helpers, offline resilience, hot-swapping, and security RBAC guards.
  - [x] Verified full suite: **94 automated test scenarios passing** (85 backend + 9 frontend, 100% green).
  - [x] Verified clean production build (`vite build` passing with zero warnings).
- [x] **Step 11.5: Conversational Zero-Citation Routing & Small Model Resilience:**
  - [x] Implemented conversational pattern router for greetings ("hi", "hello", "namaste"), identity queries ("who are you"), and confusion expressions ("whyyyyy", "help me") short-circuiting to conversational synthesizers with zero citations (`citations: []`).
  - [x] Implemented zero-score candidate chunk filtering (`score > 0.0001`) preventing ungrounded syllabus chunks from leaking into casual queries.
  - [x] Integrated anti-repetition generation parameters (`presence_penalty: 0.3`, `frequency_penalty: 0.4`) and stream substring loop detection (`_has_repetition_loop`) preventing quantized local models from looping endlessly.
- [x] **Step 11.6: Claude-Style Progressive Thinking & Interactive Stop Controls:**
  - [x] Unified thinking and response rendering into a single assistant message card inside `MessageBlock.jsx`.
  - [x] Interactive Claude-style progressive thinking accordion displaying rotating academic verbs, verification steps, and auto-collapsing into an expandable `[⚡ Thought Process (X steps) ▾]` tray.
  - [x] Red Brutalist `[STOP ⏹]` button in both message header and chat composer, backed by `AbortController` cancellation in `useRAG` custom hook and keyboard shortcut (`Escape`).
  - [x] Synchronous composer input clearing on submission.
  - [x] Replacement of legacy native browser alerts (`window.alert`, `window.confirm`) with reusable Yellow Brutalist `BrutalToast` and `BrutalModal`.

## Milestone 12: User Onboarding & 2-Tier Institutional Approval Queue (Completed)
- [x] **Step 12.1: Pre-Seeded Institutional Department Architecture:**
  - [x] Expand database schema and seeding across 10 official KIT departments (+ ADMIN & TPO):
    1. Computer Science & Engineering (B.Tech CSE, M.Tech Data Science)
    2. Computer Science & Engineering - AI & Machine Learning (B.Tech AIML)
    3. Computer Science & Engineering - Data Science (B.Tech DS)
    4. Electronics & Telecommunication Engineering (B.Tech ENTC, M.Tech Embedded)
    5. Electrical Engineering (B.Tech EE)
    6. Mechanical Engineering (B.Tech ME)
    7. Civil & Environmental Engineering (B.Tech CE)
    8. Biotechnology (B.Tech BT)
    9. Basic Sciences & Humanities (FY B.Tech Physics, Chemistry, Mathematics)
    10. Academic Examination & Autonomous Cell (Institute Regulations)
- [x] **Step 12.2: Public Self-Registration Portal (`/register`):**
  - [x] Yellow Brutalist registration form (`RegisterView.jsx`) with role selection (`Student`, `Faculty`, `HOD`).
  - [x] Dynamic department picker bound to active institutional records via `GET /api/v1/auth/departments`.
  - [x] Strict input validation: PRN (Student ID), Employee ID, institutional email (`@kitcoek.in` / `@concord.kit.edu`), and password complexity.
  - [x] Account created in `pending_tier1` or `pending_tier2` state with inactive JWT authentication guard.
- [x] **Step 12.3: 2-Tier Hierarchy Approval Workflow:**
  - [x] Tier 1 (Department Level): HOD / Department Admin approves Students and Faculty within their department (`POST /api/v1/governance/users/{id}/review`).
  - [x] Tier 2 (Platform Level): Platform Admin (Registrar / Dean Academics) approves new HODs and grants cross-institutional oversight.
  - [x] Rejection and feedback reason recording with audit ledger events.
  - [x] BOLA tenant boundary enforcement: cross-department approval attempts return `403 Forbidden`.
- [x] **Step 12.4: Admin & HOD Approval Queue UI:**
  - [x] Yellow Brutalist `UserApprovalQueue.jsx` embedded in `UsersView.jsx` with real-time pending badge counter.
  - [x] One-click Approve / Reject with confirmation modal and feedback reason notes.
  - [x] Dashboard quick alert card in `DashboardView.jsx` directing HODs/Admins directly to pending items.
  - [x] Role-restricted visibility: HOD sees only their department applicants; Platform Admin sees global applicants.
- [x] **Step 12.5: Break-Glass Fast-Track, Applicant Dossier & Global Notification Center:**
  - [x] Alembic migration `0004_user_approval_bypass.py` adding `is_bypassed` and `bypass_reason` to `users` table.
  - [x] Superadmin break-glass emergency bypass (`action: "bypass"`) with mandatory justification logged to cryptographic SHA-256 ledger.
  - [x] Direct user provisioning (`POST /api/v1/governance/users/provision-direct` & `DirectProvisionModal.jsx`).
  - [x] Universal KIT Institutional Digital ID Card (`UserProfileModal.jsx`) displaying PRN/EmpID, ASVS permissions, and session fingerprint.
  - [x] Applicant Verification Dossier (`ApplicantDossierModal.jsx`) with automated regex format checks and clearance triggers.
  - [x] Global Notification Center (`NotificationDrawer.jsx`) with Header Bell icon and live pending applicant counters.
- [x] **Step 12.6: Automated Test Suite Expansion (104 Tests Total):**
  - [x] Expanded `backend/tests/test_user_onboarding.py` to 7 integration tests covering emergency bypass, direct provisioning, and dual student clearance rules.
  - [x] Total: **104 automated test scenarios passing** (95 backend + 9 frontend, 100% green).

## Milestone 13: Declarative Jenkins CI/CD Pipeline (Planned Blueprint)
- [ ] **Step 13.1: Declarative Jenkinsfile:**
  - [ ] Multi-stage pipeline: Checkout → Lint & Security Scan → Backend Pytest (85 tests) → Frontend Unit Tests (9 tests) → Vite Production Build → Docker Build & Container Vulnerability Scan → Staging Deployment.
- [ ] **Step 13.2: Quality Gates & Test Artifact Archival:**
  - [ ] JUnit XML test result reporting (`pytest --junitxml=reports/junit.xml`).
  - [ ] Coverage threshold gating (minimum 85% coverage).
  - [ ] Security audit gate (pip-audit / safety for Python, npm audit for frontend).


