# CONCORD — System Architecture Specification (Milestone 0)

## 1. Architectural Philosophy: Modular Monolith

CONCORD is designed as a **Modular Monolith** with dependency inversion. This provides strict domain boundaries without premature microservice distributed-system complexity.

```
+-------------------------------------------------------------------------+
|                           PRESENTATION LAYER                            |
|       React (Vite) + Vanilla CSS Design System (Inter, Light/Dark UI)   |
|     Auth Context | Dashboard | Search (RRF) | Documents | Q&A (Groq)    |
+------------------------------------+------------------------------------+
                                     | HTTPS / JSON API contracts & SSE Streams
+------------------------------------v------------------------------------+
|                         BACKEND API & APPLICATION                       |
|                             FastAPI (Python 3.11/3.12)                  |
|  - API Gateway / Router v1 (/auth, /documents, /conversations, /system) |
|  - Core Security: Token Verification, RBAC Policy Guard (OWASP ASVS 4.1)|
|  - Threat Modeling: PromptGuard, SSRF Defense, Anti-BOLA, Rate Limiter  |
|  - Structured Error Handlers, Correlation IDs, Structured Logger        |
+--------------------+---------------------+--------------------+---------+
                     |                     |                    |
        +------------v-----------+  +------v-------+  +---------v------+
        |   Identity & Tenancy   |  | Organization |  |  Audit Engine  |
        |  Users, Roles, Perms   |  | Departments  |  | Security Logs  |
        +------------------------+  +--------------+  +----------------+
                     |                     |                    |
        +------------v-----------+  +------v-------+  +---------v------+
        | Ingestion & Chunkers   |  | Hybrid RRF   |  | Dual-Mode LLM  |
        | Tabular, Semantic, Win |  | BM25 + Vec   |  | Cloud (Groq)   |
        | Scanned Circular OCR   |  | FlashRank    |  | Local (Ollama) |
        +------------------------+  +--------------+  +----------------+
                     |                     |                    |
+--------------------v---------------------v--------------------v---------+
|                              DATA LAYER                                 |
|          SQLAlchemy 2.0 (Async) + Alembic Schema Migrations             |
|          PostgreSQL 16 + pgvector (Production) / SQLite (Local)         |
|          Embedded ChromaDB Vector Store (Persistent HNSW Cosine Index)  |
+-------------------------------------------------------------------------+
```

## 2. Key Architectural Tenets

1. **Server-Enforced Access Control:**
   Department filters are UI conveniences, not authorization boundaries. Every request verifies roles, permissions, and department scope in the trusted FastAPI service layer (OWASP ASVS 4.1).
2. **Deterministic Error Responses:**
   All API errors return a standard JSON envelope:
   ```json
   {
     "error": {
       "code": "PERMISSION_DENIED",
       "message": "User lacks required permission 'documents:read'",
       "details": {}
     },
     "request_id": "req-98f92b71"
   }
   ```
3. **Structured Observability:**
   Every request generates a unique `X-Request-ID` correlation tag, propagated across logs and audit events.
4. **Provider Abstraction Layer & Dual-Mode LLM:**
   External capabilities (Storage, LLMs, Embeddings, OCR) are abstracted behind abstract base contracts (`BaseLLMProvider`, `BaseEmbeddingProvider`, `BaseOCRProvider`). The dual-mode engine enables seamless hot-swapping between ultra-fast Cloud inference (`GroqCloudLLMProvider`) and private on-premises / air-gapped campus inference nodes (`LocalLLMProvider` targeting Ollama / vLLM with `qwen2.5:1.5b`) without server restarts.
5. **Zero-Citation Conversational Routing & Relevance Gating:**
   Conversational greetings, identity inquiries, and colloquial remarks are short-circuited directly to conversational synthesizers with zero retrieval citations, preventing ungrounded hallucinated citations. Retrieved candidate chunks with relevance score $\le 0.0001$ are actively filtered out.
6. **Anti-Repetition Stream Guards & Client Cancellation:**
   Local quantized model generation is protected with `presence_penalty: 0.3`, `frequency_penalty: 0.4`, and dynamic n-gram repetition breakers (`_has_repetition_loop`). SSE streams support instant client-side termination via `AbortController` bound to the UI Stop button and `Escape` key shortcut.
7. **Claude-Style Progressive Thinking Block:**
   Streaming queries display a unified assistant message block featuring dynamic rotating verbs, verification steps, and automatic collapse into an expandable `[⚡ Thought Process (X steps) ▾]` tray upon completion.
8. **2-Tier Institutional Onboarding & Approval Queue:**
   Self-registration (`/auth/register`) enforces academic credential validation (PRN/Employee ID) and assigns applicants to an unapproved state (`pending_tier1` for student/faculty, `pending_tier2` for HODs). Department Heads review Tier 1 applicants strictly within their department tenant (BOLA prevention), while Platform Admins review Tier 2 HOD nominations and system-wide delegations.
9. **Universal Identity Dossier, Break-Glass Bypass & Global Notifications:**
   Every verified user can inspect their institutional identity via a digital ID card (`UserProfileModal`). Approvers review applicants using a compliance verification dossier (`ApplicantDossierModal`). Superadmins possess break-glass administrative bypass (`is_bypassed` with recorded justification) and direct provisioning capabilities (`POST /governance/users/provision-direct`). The global Header Bell notification center (`NotificationDrawer`) delivers real-time clearance alerts, compliance notices, and institutional bulletins.
