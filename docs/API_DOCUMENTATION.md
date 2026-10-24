# CONCORD IKMS — Comprehensive API Reference

> Base URL: `http://localhost:8000/api/v1`  
> Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`  
> ReDoc Documentation: `http://localhost:8000/redoc`

[← Back to Main Documentation Index](../README.md#📚-documentation-index)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0284c7', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#0369a1', 'lineColor': '#38bdf8', 'secondaryColor': '#0f172a', 'tertiaryColor': '#1e293b', 'actorBkg': '#1e293b', 'actorBorder': '#0284c7', 'actorTextColor': '#ffffff', 'signalColor': '#38bdf8', 'signalTextColor': '#f8fafc', 'labelBoxBkgColor': '#0f172a', 'labelBoxBorderColor': '#334155', 'labelTextColor': '#f8fafc', 'loopTextColor': '#f8fafc', 'noteBorderColor': '#0284c7', 'noteBkgColor': '#0f172a', 'noteTextColor': '#f8fafc', 'fontFamily': 'Inter, sans-serif'}}}%%
sequenceDiagram
    autonumber
    actor Client as Frontend Client (React)
    participant Auth as /auth API
    participant Docs as /documents API
    participant Search as /search & /rag API
    participant Bench as /benchmarks API
    participant PG as PostgreSQL (pgvector)
    participant LLM as Groq Cloud LLM

    Note over Client,Auth: 1. Identity & RBAC Session
    Client->>Auth: POST /auth/login (or /demo-login)
    Auth-->>Client: JWT Bearer Token + Role Scopes

    Note over Client,Docs: 2. Document Ingestion
    Client->>Docs: POST /documents/upload (Multipart)
    Docs->>PG: Deduplicate SHA-256 + Save Chunks & Embeddings
    Docs-->>Client: 201 Created (document_id, chunk_count)

    Note over Client,Search: 3. Intelligent Query Execution
    Client->>Search: POST /rag/ask (query, department_id)
    Search->>PG: Hybrid Search (ChromaDB + BM25 Lexical)
    PG-->>Search: Matched Chunks + Provenance
    Search->>LLM: Augmented Prompt Generation
    LLM-->>Search: Grounded Synthesized Answer
    Search-->>Client: Answer + Cited Source Cards [1] + Latency

    Note over Client,Bench: 4. Verification & Benchmarking
    Client->>Bench: POST /evaluation/run
    Bench-->>Client: Execution Metrics (P95 Latency, MRR, Hit Rate@5)
```

---

## 1. Authentication & Identity (`/auth`)

### `POST /auth/login`
- **Description:** Authenticates user via email and bcrypt password hash.
- **Request Body:**
  ```json
  {
    "email": "admin@concord.kit.edu",
    "password": "Admin@12345"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "admin@concord.kit.edu",
      "full_name": "Dr. A. Sharma (Platform Admin)",
      "roles": ["platform_admin"]
    }
  }
  ```

### `POST /auth/demo-login`
- **Description:** One-click instant login for viva evaluator role switching (`platform_admin`, `dept_admin`, `faculty`, `student`).
- **Request Body:** `{"role_code": "student"}`

### `GET /auth/me`
- **Description:** Returns the authenticated user's profile, roles, and granted permissions.
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Document Ingestion & Chunk Inspection (`/documents`)

### `POST /documents/upload`
- **Description:** Multipart file upload. Automatically deduplicates via SHA-256 and routes to the appropriate chunker (`TabularChunker`, `SemanticParagraphChunker`, or `SlidingWindowTextChunker`).
  - **OCR Fallback Engine:** Automatically detects scanned image PDFs ($<30$ characters of text stream) and triggers the OCR provider pipeline (`PytesseractOCRProvider` / `GracefulFallbackOCRProvider`), tagging chunks with `is_ocr: true` and extraction engine.
- **Headers:** `Authorization: Bearer <token>` (Requires `documents:write`)
- **Form Data:**
  - `file`: Binary file (`.pdf`, `.docx`, `.xlsx`, `.txt`, `.md`, `.csv`)
  - `department_id`: Department UUID
  - `title`: Optional display title

### `GET /documents`
- **Description:** Lists documents filtered by department and user RBAC permissions.
- **Query Params:** `?department_id=<id>`

### `GET /documents/{document_id}`
- **Description:** Returns full document metadata and extracted chunk segments.

### `PATCH /documents/{document_id}/lifecycle`
- **Description:** Updates document lifecycle state (`active`, `superseded`, `archived`) and version tag.

### `DELETE /documents/{document_id}`
- **Description:** Permanently deletes document record, storage file, and associated ChromaDB vectors.

---

## 3. Governance & Human-in-the-Loop Review (`/governance`)

### `GET /governance/pending-documents`
- **Description:** Lists documents currently awaiting approval. HODs only see their assigned department. Platform Admins see all.

### `POST /governance/documents/{document_id}/review`
- **Description:** Approves or rejects a quarantined document. Upon approval, vectors are atomically synced into the active ChromaDB index.
- **Request Body:**
  ```json
  {
    "decision": "approved",
    "notes": "Verified against 2024 Academic Council circular."
  }
  ```

---

## 4. Contextual Search (`/search`)

### `POST /search/query`
- **Description:** Hybrid search combining BM25-style lexical matching and ChromaDB vector embeddings fused via Reciprocal Rank Fusion (RRF) and re-ranked with FlashRank Cross-Encoder.
- **Request Body:**
  ```json
  {
    "query": "passing criteria in autonomous exam",
    "top_k": 5,
    "lifecycle_status": "active"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "query": "passing criteria in autonomous exam",
    "results": [
      {
        "chunk_id": "uuid",
        "document_filename": "KIT_Autonomous_Academic_Regulations_2024.pdf",
        "score": 0.9845,
        "content": "A student must secure at least 40% in ESE...",
        "lifecycle_status": "active",
        "version": "v2.0"
      }
    ]
  }
  ```

---

## 5. Grounded RAG & Conversational Assistant (`/rag`, `/conversations`)

### `POST /rag/ask`
- **Description:** Adaptive query endpoint. Automatically routes between:
  1. **Direct Conversational Response:** Natural chit-chat / greetings without querying the vector index (`retrieval_mode: "direct_conversational"`).
  2. **Multi-Step Comparative Synthesis:** Version and policy comparisons (`retrieval_mode: "multi_step_comparative"`).
  3. **Grounded RAG:** Strict institutional evidence grounding with verified bracket citations (`retrieval_mode: "hybrid_rrf"`).
  4. **Guardrail Defense Interception:** If prompt injection, delimiter smuggling (`[INST]`, `<|im_start|>`), or harmful queries are detected, the request is intercepted at 0ms latency (`retrieval_mode: "blocked_by_guardrail"`), returning a polite institutional refusal.
- **Request Body:**
  ```json
  {
    "query": "What is the passing criteria for Autonomous Exam under 2024 regulations?",
    "include_superseded": false,
    "top_k": 5
  }
  ```
- **Response (200 OK — Grounded Mode):**
  ```json
  {
    "answer": "Under the 2024 Autonomous Academic Regulations, a student must secure at least 40% in the End Semester Examination [1]...",
    "citations": [
      {
        "citation_id": 1,
        "document_title": "Autonomous Academic & Examination Regulations (2024 Curriculum)",
        "document_filename": "KIT_Autonomous_Academic_Regulations_2024.pdf",
        "sha256_hash": "a4f8...",
        "lifecycle_status": "active",
        "version": "v2.0"
      }
    ],
    "model_used": "groq:openai/gpt-oss-120b",
    "latency_ms": 1120.4,
    "retrieval_mode": "hybrid_rrf"
  }
  ```
- **Response (200 OK — Conversational Greeting Mode):**
  ```json
  {
    "answer": "Hello! I am CONCORD, your Institutional Knowledge Assistant for Kolhapur Institute of Technology...",
    "citations": [],
    "model_used": "groq:openai/gpt-oss-120b",
    "latency_ms": 380.2,
    "retrieval_mode": "direct_conversational"
  }
  ```

### `GET /conversations`
- **Description:** Lists recent conversation sessions belonging to the authenticated user.
- **Access Rule:** Scoped strictly to threads where `owner_id == current_user.id`. Other users' threads are never returned.
- **Query Parameters:** `limit` (default: 30)

### `POST /conversations`
- **Description:** Explicitly creates a new multi-turn conversation session.
- **Security Rule:** `owner_id` is derived server-side from the verified JWT token. Any `owner_id` or `user_id` in the request payload is ignored.

### `GET /conversations/{conversation_id}`
- **Description:** Retrieves message history and citations for a conversation thread.
- **Access Rule:** Enforces `ConversationPolicy`. If the requestor is not the owner, returns **`404 Not Found`** (anti-probing). Platform administrators cannot inspect private conversation dialogues of other users.

### `DELETE /conversations/{conversation_id}`
- **Description:** Deletes a conversation session and cascades deletion of its message turns.
- **Access Rule:** Owner only. Non-owners receive **`404 Not Found`**.

### `POST /conversations/ask`
- **Description:** Executes a turn in an active or new conversation, resolving pronouns from preceding turns and grounding responses with ChromaDB vector citations.
- **Access Rule:** Requires `documents:read`. Grounding citations strictly respect departmental RBAC boundaries.

---

## 6. Resource Access & Isolation Matrix

| Endpoint | Method | Resource | Access Rule | Unowned / Unauthorized Response |
| :--- | :--- | :--- | :--- | :--- |
| `/conversations` | `GET` | Threads List | `owner_id == current_user.id` | Returns only own threads |
| `/conversations/{id}` | `GET` | Thread Detail | `owner_id == current_user.id` | **`404 Not Found`** |
| `/conversations/{id}` | `DELETE` | Thread Delete | `owner_id == current_user.id` | **`404 Not Found`** |
| `/conversations` | `POST` | Thread Create | Bound to token user ID | N/A (Server sets owner) |
| `/documents` | `GET` | Documents List | Department membership or `visibility == 'public'` | Filtered by tenant/visibility |
| `/documents/{id}` | `GET` | Document Detail | Department membership or public | **`404 Not Found`** |
| `/documents/{id}/download` | `GET` | Raw Binary | Department membership or public | **`404 Not Found`** |
| `/audit/events` | `GET` | Security Logs | `platform_admin` only | **`403 Forbidden`** |
| `/users` | `GET` | Users List | `platform_admin` (all) / Others (self profile only) | Scoped to self |
| `/evaluation/run` | `POST` | Live Benchmark | `platform_admin` (`system:admin`) | **`403 Forbidden`** |

---

## 7. Evaluation & Benchmarking (`/evaluation`)

### `GET /evaluation/metrics`
- **Description:** Returns the comparative retrieval architecture matrix (BM25 vs Vector vs CONCORD Hybrid).

### `POST /evaluation/run`
- **Description:** Triggers live execution across 5 canonical test scenarios, calculating Hit Rate@5, MRR@5, and security leakage. Requires `system:admin`.

---

## 8. System Health & Maintenance (`/healthz`, `/readyz`, `/admin`)

### `GET /healthz`
- **Description:** Liveness probe returning service name and environment.

### `GET /readyz`
- **Description:** Readiness probe checking live database connectivity and round-trip latency.

### `POST /admin/reseed-demo`
- **Description:** Reseeds canonical multi-department demo records into SQLite and ChromaDB. Guarded by `platform_admin`.
