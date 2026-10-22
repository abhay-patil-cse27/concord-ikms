# CONCORD — Master Engineering Brief and Implementation Instructions

[← Back to Main Documentation Index](../README.md#📚-documentation-index)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0284c7', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#0369a1', 'lineColor': '#38bdf8', 'secondaryColor': '#0f172a', 'tertiaryColor': '#1e293b', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155', 'fontFamily': 'Inter, sans-serif'}}}%%
graph LR
    subgraph Multi_Source_Inputs ["Institutional Knowledge Sources"]
        PDF["Academic Syllabi & Schemes<br/>(.pdf)"]
        Forms["Exam Forms & Circulars<br/>(.docx / .txt)"]
        Sheets["Staff & Lab Timetables<br/>(.xlsx / .csv)"]
    end

    subgraph Trust_Grounded_Core ["CONCORD Cognitive Core"]
        AuthZ["RBAC Multi-Tenancy<br/>(OWASP ASVS 4.1)"]
        Hybrid["Hybrid Search (Dense + Sparse)<br/>+ Cross-Encoder Reranking"]
        Grounding["Grounded Answer Synthesizer<br/>(Zero-Hallucination Guardrails)"]
        Audit["Tamper-Evident SHA-256<br/>Provenance & Audit Ledger"]
    end

    subgraph Institutional_Consumers ["Authorized Stakeholders"]
        Students["Students<br/>(Curriculum, Fees, Rules)"]
        Faculty["Faculty<br/>(Department Minutes, Research)"]
        Admin["HOD / Admin<br/>(Audit Trails, Overrides)"]
    end

    PDF --> AuthZ
    Forms --> AuthZ
    Sheets --> AuthZ

    AuthZ --> Hybrid
    Hybrid --> Grounding
    Grounding --> Audit

    Audit --> Students
    Audit --> Faculty
    Audit --> Admin

    classDef default fill:#1e293b,stroke:#0284c7,stroke-width:1.5px,color:#ffffff;
```

---

## 1. Your role

Act as the principal software architect, senior full-stack engineer, AI/ML engineer, application security engineer, and technical lead for a major academic software project.

You are responsible for translating the specification below into a working, maintainable, testable institutional knowledge platform.

Do not behave like a code generator that creates many files without a coherent design. Work incrementally, inspect the existing repository, establish a reliable foundation, implement complete vertical slices, test each slice, and document every significant architectural decision.

The project must be suitable for an academic major project and demonstrate sound software engineering practices that can form the basis of a real institutional pilot.

## 2. Product identity

Product: CONCORD

Full title: Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Trust-Aware Institutional Intelligence.

Project: Mega Project 2026–27.

Target environment: An educational institution, initially modeled around KIT, Kolhapur Institute of Technology's College of Engineering.

Core concept: A secure institutional intelligence platform that integrates approved knowledge sources, maintains contextual memory, retrieves relevant evidence, and produces trustworthy, traceable answers.

The platform should bring together the useful ideas behind enterprise knowledge discovery and persistent contextual memory. Do not copy the implementation or proprietary design of any commercial product.

## 3. Product mission

Build a platform that allows authorized students, faculty, department administrators, and institutional staff to find and understand institutional knowledge distributed across documents, notices, policies, forms, structured data, and eventually approved external systems.

The system must not be merely a document chatbot.

It must provide:

- A unified source and document registry.
- Reliable ingestion of institutional files.
- Structured metadata and document version management.
- Permission-aware keyword, semantic, and hybrid retrieval.
- Evidence-grounded answer generation with source citations.
- Contextual conversation continuity and governed persistent memory.
- Document freshness and supersession awareness.
- Conflict detection and human review.
- Bounded multi-step AI workflows.
- Role-based access control and auditability.
- An evaluation framework that measures retrieval, grounding, security, and reliability.
- A deployment architecture that can run locally and later be adapted to approved hosted infrastructure.

## 4. The three non-negotiable product objectives

### Objective A — UNIFY

Create a consistent institutional knowledge layer over multiple sources.

Requirements:

- Normalize metadata across supported document formats and future connectors.
- Preserve original files and source identity.
- Track ownership, departments, access policies, versions, and lifecycle.
- Retain provenance from source to extracted text, chunks, retrieval results, and citations.
- Avoid locking the system to one file format, storage provider, or institution-specific schema.

### Objective B — UNDERSTAND

Retrieve the right knowledge in the context of the question and the requesting user.

Requirements:

- Combine keyword retrieval and semantic vector retrieval.
- Support hybrid ranking and optional reranking.
- Use department, user, document status, and date context appropriately.
- Distinguish current-policy questions from historical questions.
- Generate answers using a bounded, explicit evidence bundle.
- Support clarifying questions and insufficient-evidence responses.
- Keep conversational memory separate from institutional source-of-truth records.

### Objective C — TRUST

Ensure that generated answers are permission-safe, evidence-backed, current where possible, and auditable.

Requirements:

- Enforce authorization on the server before retrieving content.
- Validate all citations against actual retrieved evidence.
- Track document versions and supersession relationships.
- Flag contradictory or stale sources.
- Make uncertainty explicit.
- Require human approval for consequential actions.
- Record security-relevant actions and workflow outcomes.
- Evaluate the system against reproducible test datasets.

## 5. Scope boundaries

### In scope

1. Web application with authentication and role-based dashboards.
2. Institutional departments and membership.
3. PDF, DOCX, PPTX, XLSX, TXT, and Markdown ingestion.
4. OCR support for scanned documents through a replaceable adapter.
5. Private file storage.
6. Metadata normalization and document versioning.
7. Background ingestion jobs, retries, and failure inspection.
8. PostgreSQL-backed document and metadata storage.
9. Vector retrieval using pgvector.
10. PostgreSQL full-text search and hybrid retrieval.
11. Evidence-grounded RAG with validated citations.
12. Conversation history and scoped persistent memory.
13. Freshness and conflict-management functionality.
14. Bounded, auditable agent workflows.
15. Administrative tools and audit logs.
16. Evaluation, security testing, documentation, and reproducible deployment.

### Out of scope for the initial MVP

- Unauthorized access to institutional ERP, examination, accounts, or student databases.
- Automatic modification of official institutional records.
- Autonomous publication of official notices.
- An unrestricted AI agent with shell or production database access.
- Mandatory Kubernetes or premature microservice decomposition.
- Training a foundation model from scratch.
- A requirement to use paid LLM APIs.
- Claims of production readiness without measured evidence.
- Automatic approval of conflicting institutional policies.

Use synthetic or explicitly authorized sample data. Design connectors as interfaces first; do not invent access to systems for which credentials and approval have not been provided.

## 6. Default technology stack

Use this stack unless repository inspection identifies a compelling, documented reason to adapt it.

Frontend:

- Next.js with TypeScript.
- A consistent, accessible component system.
- Typed API client.
- Responsive layouts.
- Feature-based component organization.

Backend:

- Python.
- FastAPI.
- Pydantic schemas.
- SQLAlchemy 2.x or an equivalent well-supported ORM.
- Alembic database migrations.
- pytest for testing.

Database and storage:

- PostgreSQL.
- pgvector.
- PostgreSQL full-text search.
- Private S3-compatible object storage.
- MinIO for a self-hosted development profile if appropriate.

Document processing:

- PyMuPDF for PDF text extraction.
- python-docx for DOCX.
- python-pptx for PPTX.
- openpyxl for XLSX.
- PaddleOCR as an optional OCR implementation.
- A common parser interface so individual parsers can be replaced.

AI:

- Configurable chat-model provider.
- Configurable embedding provider.
- Optional reranker provider.
- Ollama as a convenient local development option.
- vLLM as an optional serving option when hardware and operational requirements justify it.
- BGE-M3 as a candidate embedding model, not a hardwired dependency.
- LangGraph for selected multi-step workflows after the basic retrieval pipeline is stable.

Infrastructure:

- Docker Compose for local development.
- Dedicated background worker process.
- Redis and a task queue only where needed for reliable job processing.
- Structured application logging.
- Health and readiness checks.
- Automated test and lint workflows in CI.

Pin and verify compatible package versions. Consult official documentation before selecting versions or implementing APIs. Do not invent package functions or configuration options.

## 7. Architecture requirements

Use a modular monolith with well-defined module boundaries and separately runnable background workers.

Organize the application into the following logical modules:

- Identity and authentication.
- Organization and department management.
- Document registry.
- Ingestion and extraction.
- Metadata and version lifecycle.
- Search and retrieval.
- RAG and answer generation.
- Conversations.
- Persistent memory.
- Freshness and conflict management.
- Agent workflows.
- Audit and observability.
- Evaluation and benchmarks.
- Provider integrations.

The frontend must communicate with the backend through documented APIs. The backend must own authorization, business logic, persistence, retrieval policy, and model orchestration.

Use dependency inversion. Business services must depend on interfaces rather than concrete LLM, OCR, embedding, storage, or queue implementations.

Keep routes thin, validate input at boundaries, use typed service contracts, and keep persistence concerns out of frontend code.

Do not create a separate microservice for every module. Establish modular boundaries first and extract a service only when a demonstrated operational need justifies it.

## 8. Repository inspection and initial assessment

Before modifying code:

1. Inspect the complete repository structure.
2. Read existing README files, project instructions, dependency manifests, environment examples, and database migrations.
3. Identify implemented features, incomplete features, existing tests, and architectural problems.
4. Check whether frontend and backend already exist.
5. Identify available development tools and container requirements.
6. Determine which services can run in the current environment.
7. Preserve existing working functionality unless a documented change is necessary.
8. Identify secrets or sensitive files that must not be exposed.
9. Produce a concise repository assessment.
10. Write a prioritized implementation plan with dependencies and acceptance criteria.

Do not replace an existing application with a fresh scaffold simply because your preferred template is different.

If the repository is empty, establish the proposed structure and document why.

Do not delete, rename, or rewrite major components without understanding their purpose.

## 9. Required repository documentation

Create or maintain these documents:

- README.md: product overview, setup, commands, and development workflow.
- docs/architecture/system-overview.md: components, boundaries, and data flow.
- docs/architecture/data-model.md: entities, relationships, and lifecycle.
- docs/architecture/retrieval-pipeline.md: retrieval and ranking design.
- docs/architecture/security-model.md: identity, authorization, threat boundaries, and sensitive-data handling.
- docs/architecture/deployment.md: local, self-hosted, and future hosted deployment profiles.
- docs/decisions/: Architecture Decision Records.
- docs/api/: API conventions and representative contracts.
- docs/evaluation/: datasets, metrics, methodology, and results.
- docs/operations/: backup, restoration, recovery, and troubleshooting.
- .env.example: documented configuration without real secrets.
- CHANGELOG.md: material implementation changes.

Architecture Decision Records must explain the context, alternatives, selected approach, trade-offs, and conditions that might justify revisiting the decision.

## 10. Core domain model

Design the schema around explicit entities, foreign keys, integrity constraints, and migrations.

At minimum, evaluate the need for:

- User.
- Role and permission.
- Department or organizational unit.
- Membership.
- Document.
- DocumentVersion.
- DocumentChunk.
- ChunkEmbedding.
- SourceRelationship.
- IngestionJob.
- Conversation.
- Message.
- MemoryEntry.
- ConflictCase.
- WorkflowRun.
- WorkflowEvent.
- AuditEvent.
- EvaluationCase.
- EvaluationRun.

Do not add tables mechanically. Document the purpose and relationships of every implemented entity.

Important rules:

1. A logical document and its versions are different records.
2. A chunk belongs to a specific document version.
3. A citation must identify the actual version and source location used.
4. An embedding records which model and configuration produced it.
5. Changing embedding dimensions or models requires a planned reindexing strategy.
6. A failed ingestion job must not silently publish an incomplete document.
7. Document deletion and retention must respect authorization, retention rules, and references.
8. Audit events must not become a secondary store for complete sensitive document contents.
9. Model-generated metadata must not automatically override verified institutional metadata.
10. Use UTC timestamps internally and document how local institutional dates are presented.

## 11. Module implementation requirements

### A. Identity and access control

Implement:

- User authentication.
- Secure session/token handling.
- Role and permission definitions.
- Department memberships.
- Resource-level authorization.
- Document visibility policies.
- Administrative role management.
- Audit events for sensitive actions.

Authorization must be checked on the server for every protected operation, including retrieval, document download, citations, conversation history, memory access, and agent tools.

Never trust a role, department ID, document ID, or authorization flag supplied by the browser without validating it against the authenticated identity and server-side policy.

Create tests for unauthorized access, cross-department leakage, revoked access, and privilege escalation.

### B. Document ingestion

Implement a background processing pipeline:

Upload
→ validate file
→ authorize uploader
→ store original
→ create job
→ extract text and structure
→ OCR when needed
→ normalize
→ attach metadata and provenance
→ chunk
→ generate embeddings
→ index
→ mark version ready.

Track each processing stage and its failure reason.

Support retries, idempotency, checksums, job timeouts, and reprocessing. Protect against oversized files, malformed documents, path traversal, unsafe file types, and parser resource exhaustion.

Treat all uploaded document content as untrusted data.

Preserve page numbers, headings, table context, and other source-location metadata where the parser supports it. Never invent a page number when it cannot be established.

### C. Document lifecycle and versions

Implement immutable document-version records and controlled lifecycle transitions.

Support:

- Draft or pending-review state.
- Processing state.
- Active state.
- Superseded state.
- Archived state.
- Failed processing state.

Use explicit effective dates, approval metadata, ownership, and supersession relationships where available.

Do not assume that the newest upload is the most authoritative document.

Allow authorized historical queries without accidentally treating historical material as current policy.

### D. Search and retrieval

Implement a retrieval service with these stages:

1. Query validation and normalization.
2. Authorization-context resolution.
3. Scope and lifecycle filtering.
4. Keyword/full-text search.
5. Vector similarity search.
6. Candidate merging with a tested ranking method.
7. Optional reranking.
8. Evidence selection within a configured context budget.
9. Structured retrieval response with source IDs and locations.

Create configurable retrieval strategies rather than embedding all ranking logic into a single function.

Use a deterministic baseline before adding complex query-rewriting or agent-based retrieval.

Expose retrieval diagnostics for authorized developers and administrators without leaking sensitive content.

Build tests using questions whose expected evidence is known.

### E. RAG and answer generation

Implement a service that accepts a question and an authorized evidence bundle.

The service must:

- Produce a direct, useful answer.
- Use retrieved institutional evidence for institutional claims.
- Attach citations using validated evidence identifiers.
- State uncertainty when sources disagree.
- Abstain or ask for clarification when evidence is insufficient.
- Avoid fabricated citations, links, pages, and institutional facts.
- Keep model prompts, internal metadata, and hidden content private.
- Validate the final structured response before returning it.

Separate retrieval quality from answer-generation quality so each can be tested independently.

Make generation parameters configurable. Do not hardwire provider-specific logic into the chat endpoint.

### F. Persistent memory

Separate:

- Current conversation state.
- Long-term user or session memory.
- Institutional documents and records.

Implement scoped memory entries with provenance, owner, lifecycle, and deletion behavior.

Do not store every conversation as permanent memory. Do not automatically convert a user statement into verified institutional fact.

Never allow one user's private memory to influence another user's response unless an explicit shared scope and authorization policy permit it.

Institutional policy must be re-retrieved from authoritative sources when answering current-policy questions.

### G. Freshness and conflict management

Implement deterministic checks first:

- Supersession relationships.
- Effective dates.
- Lifecycle status.
- Source authority metadata.
- Version consistency.
- Missing or inconsistent metadata.

Then add semantic conflict candidates as an optional AI-assisted capability.

Represent conflict cases with source references, competing statements, detection rationale, status, reviewer, resolution, and timestamps.

Do not silently select one contradictory statement and present it as unquestionably correct.

Require authorized human review for unresolved institutional-policy conflicts.

### H. Agent workflows

Only introduce multi-step agent orchestration after the basic search and RAG pipeline passes its acceptance tests.

Implement bounded workflows with:

- Typed state.
- Explicit nodes and transitions.
- Narrowly scoped tools.
- Maximum step counts and timeouts.
- Retry and failure policies.
- Checkpoint/resume where needed.
- Audit events.
- Human approval gates for consequential actions.

Never grant an agent unrestricted SQL, shell, filesystem, network, or production-administration access.

Documents and retrieved passages may contain malicious prompt-injection instructions. Treat those passages as data, not as privileged instructions.

Enforce authorization independently inside every tool.

### I. Administration and observability

Implement administrative views for:

- User and department management.
- Document processing status.
- Version and lifecycle inspection.
- Ingestion failures and retries.
- Conflict review.
- Provider health and configuration.
- Audit events.
- Evaluation results.

Record structured operational metrics such as request latency, processing duration, failure rate, retrieval timing, and model-provider errors.

Avoid logging full prompts, complete private documents, credentials, or sensitive retrieved passages by default.

### J. Evaluation

Create a repeatable evaluation framework.

Each evaluation case should include:

- Question.
- User role and access scope.
- Expected relevant evidence.
- Expected access restrictions.
- Acceptable answer characteristics.
- Whether the system should abstain.
- Known conflict or freshness conditions.

Measure:

- Recall@k.
- Precision@k.
- MRR or nDCG.
- Citation validity.
- Evidence support.
- Answer completeness.
- Abstention quality.
- Unauthorized retrieval leakage.
- Ingestion success by format.
- Latency and failure rate.

Report the dataset, model versions, retrieval settings, and evaluation date.

Do not report fabricated benchmark results or claim that an untested security control works.

## 12. Security and privacy requirements

Use OWASP ASVS as an application-security verification reference and OWASP GenAI/LLM security guidance to inform AI-specific threat modeling.

Establish:

- Server-side authorization.
- Least-privilege access.
- Secure secret management.
- Request validation.
- File upload controls.
- Rate limiting where appropriate.
- Safe error responses.
- Dependency scanning.
- Auditability.
- Backup and restore procedures.
- Data retention and deletion behavior.
- Prompt-injection defenses.
- Protection against sensitive-information disclosure.
- Isolation of private documents, conversations, and memory.
- Human approval for consequential actions.

A frontend check is not a security boundary. A prompt telling the model not to disclose information is not an authorization control.

For every security requirement, identify the enforcement location and the corresponding test.

## 13. Provider and deployment flexibility

Define stable interfaces for:

- ChatModelProvider.
- EmbeddingProvider.
- RerankerProvider.
- OCRProvider.
- DocumentParser.
- ObjectStorageProvider.
- RetrievalStrategy.
- InstitutionalConnector.

Provide a configuration-driven local profile using local infrastructure and an optional local LLM endpoint.

Allow an approved hosted model endpoint to be configured without changing business logic.

Keep model configuration separate from document-processing, retrieval, and authorization code.

Support deployment configuration for:

1. Local development.
2. Single-server self-hosted pilot.
3. Future hosted deployment.

Do not promise that a particular model will run acceptably without measuring RAM, VRAM, concurrency, latency, and model quality.

Do not store credentials in source control. Provide only placeholders in environment examples.

## 14. Development workflow and milestone gates

Work in the following sequence.

### Milestone 0 — Discovery

Inspect the repository, identify the current implementation, write the architecture overview, record risks, and produce a prioritized backlog.

Deliver:

- Repository assessment.
- Architecture diagram.
- Initial ADRs.
- Domain-model draft.
- Acceptance criteria.
- Development setup instructions.

### Milestone 1 — Foundation

Implement the frontend shell, API foundation, configuration, database connection, migrations, health endpoints, authentication, basic RBAC, structured errors, logging, and Docker Compose.

Exit condition: a clean setup can start the application, authenticate a user, enforce a protected endpoint, and persist data.

### Milestone 2 — Ingestion

Implement document upload, private storage, parser interfaces, extraction, OCR adapter, ingestion jobs, metadata, chunks, and processing status.

Exit condition: supported documents can be processed and inspected, with recoverable failures and source traceability.

### Milestone 3 — Retrieval

Implement keyword search, vector search, hybrid ranking, permission filters, lifecycle filters, and evidence metadata.

Exit condition: relevant authorized evidence can be retrieved and evaluated independently of the LLM.

### Milestone 4 — Grounded answers

Implement the model-provider adapter, RAG pipeline, validated citations, insufficient-evidence handling, conversation persistence, and answer tests.

Exit condition: a complete question-to-answer flow works with traceable evidence.

### Milestone 5 — Memory and trust

Implement version history, supersession, freshness indicators, conflict cases, memory scoping, and review workflows.

Exit condition: the application distinguishes current evidence from historical evidence and can surface unresolved conflicts.

### Milestone 6 — Bounded workflows

Implement a real multi-step workflow with explicit state, scoped tools, audit events, failure handling, and human approval.

Exit condition: the workflow can be demonstrated and tested without bypassing access controls.

### Milestone 7 — Evaluation and hardening

Add security tests, retrieval benchmarks, answer-quality evaluation, integration tests, load testing, and backup/restore validation.

Exit condition: results and limitations are documented and reproducible.

### Milestone 8 — Deployment and demonstration

Provide a reproducible deployment, operational documentation, sample dataset, demo accounts for development only, end-to-end scenarios, and a final architecture report.

Exit condition: another developer can start the project using the documented instructions and reproduce the main demonstration.

## 15. Engineering quality gates

Every milestone must include:

- Working implementation.
- Unit tests for business logic.
- Integration tests for important persistence and API behavior.
- Authorization tests where data access is involved.
- Updated documentation.
- Migration and configuration changes where required.
- A clear list of limitations.
- A reproducible verification command.

Use linting, formatting, type checking, and automated tests in CI.

Do not merge or mark a milestone complete solely because code compiles.

Do not leave core workflows as mocked UI, hardcoded responses, fake search results, or TODO comments.

Mocks are acceptable in isolated tests, but the application must have a real end-to-end path through its actual persistence and service layers.

## 16. Coding-agent operating rules

1. Inspect before modifying.
2. Implement one coherent vertical slice at a time.
3. Keep changes small enough to review and test.
4. Do not generate the entire application in one uncontrolled pass.
5. Do not introduce unnecessary abstractions, dependencies, or infrastructure.
6. Never hide failures behind success responses.
7. Never claim a test passed unless it was actually executed successfully.
8. Never invent credentials, APIs, external system access, benchmark scores, or deployment capabilities.
9. Do not expose secrets in logs, documentation, or commits.
10. Do not disable security checks to make a demo work.
11. Do not silently change the approved architecture; document and justify material deviations.
12. Preserve existing working features.
13. Ask for clarification only when a decision materially affects correctness, security, cost, or an irreversible action.
14. When blocked by missing infrastructure, implement a clear interface, explain the blocker, and continue with testable components.
15. Prefer a simple, measurable baseline over an impressive but unverified AI workflow.
16. Keep all generated documentation consistent with the actual code.

## 17. Required initial output

Before substantial implementation, provide:

A. Repository assessment.

B. Architecture and data-flow description.

C. Initial domain model and entity relationships.

D. Module dependency map.

E. Prioritized implementation backlog.

F. Risk register covering security, model quality, OCR, data quality, performance, and deployment.

G. Architecture Decision Records for major stack choices.

H. Local setup and verification plan.

I. The first milestone's acceptance criteria.

J. The precise files and components you intend to change in the first implementation slice.

Do not stop after producing a plan. Once the repository assessment is complete and no critical decision is blocked, proceed to Milestone 1 in a controlled, testable manner.

## 18. First end-to-end demonstration target

The initial meaningful demonstration must eventually support this scenario:

1. An authorized department administrator uploads an institutional policy PDF.
2. The system stores the original file and creates a traceable document record.
3. The ingestion worker extracts the content and indexes it.
4. An authorized user asks a question about the policy.
5. The retrieval pipeline finds relevant sections using hybrid search.
6. The answer-generation service produces a concise answer grounded in the retrieved sections.
7. The user can open the citation and inspect the correct source location.
8. An unauthorized user cannot access the same document, its chunks, or its citation target.
9. An updated policy can be ingested as a new version without losing the previous version.
10. The system identifies superseded or conflicting evidence when the relevant metadata and rules support that conclusion.

This scenario is the central vertical slice against which architecture and implementation decisions should be evaluated.

## 19. Definition of done

A feature is complete only when:

- Its intended behavior is implemented.
- Its authorization requirements are enforced.
- Its failure behavior is defined.
- Its persistence behavior is correct.
- Tests have been run.
- Relevant documentation has been updated.
- Its acceptance criteria have been verified.
- Any limitations are explicitly recorded.

The ultimate goal is a secure, adaptable, evidence-grounded institutional intelligence platform that demonstrates the three CONCORD objectives: UNIFY, UNDERSTAND, and TRUST.

Begin by inspecting the existing repository and preparing the Milestone 0 assessment. Then proceed incrementally toward the first working end-to-end slice. Do not attempt to implement every advanced capability before the foundation is verified.
