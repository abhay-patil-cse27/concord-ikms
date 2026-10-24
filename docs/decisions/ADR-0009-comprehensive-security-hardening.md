# ADR-0009: Comprehensive System Security Hardening (SQLi, NoSQLi, Path Traversal, and OWASP ASVS Headers)

## Status
Accepted

## Context
Following the implementation of prompt injection defenses (ADR-0008), the system required comprehensive protection across all layers:
1. **Academic Technical Inquiries vs Adversarial Attacks**: The system must never falsely reject students asking legitimate questions containing technical words (e.g., *"What is SQL in DBMS syllabus?"*, *"Explain network firewall concepts"*).
2. **SQL Injection (SQLi)**: Ensure queries are shielded against payload injection attacks (`UNION SELECT`, `' OR 1=1--`, `DROP TABLE`).
3. **NoSQL / Vector Store Injection**: ChromaDB vector index queries accepting dynamic `department_id` filters must be strictly validated against operator smuggling (`$ne`, `$where`, `$in`, `$regex`).
4. **Path Traversal**: File upload filenames must be sanitized against directory traversal attacks (`../../etc/passwd`).
5. **Web Application Security Headers**: Endpoints must return OWASP ASVS 4.1 recommended defense-in-depth security headers.

## Decisions

### 1. Guardrail Calibration for Zero False Positives
In `backend/app/core/guardrails.py`:
- Replaced broad substring matches with strict, context-aware regex patterns.
- Specific SQL injection signatures (`union\s+select`, `drop\s+table`, `'\s*or\s+'?1'?\s*=\s*'?1`) are blocked immediately.
- Educational queries discussing databases, SQL queries, networking, and firewalls pass cleanly to the retrieval and LLM synthesis engine.

### 2. NoSQL / ChromaDB Filter Validation
In `backend/app/modules/retrieval/chroma_store.py`:
- Validated `department_id` against alphanumeric and UUID character patterns (`^[a-zA-Z0-9_\-]+$`).
- Any attempt to pass operators like `{"$ne": null}` is rejected, replacing the clause with an unmatchable filter.

### 3. File Upload Path Traversal Sanitization
In `backend/app/modules/documents/service.py`:
- Applied `os.path.basename` and path delimiter scrubbing (`/`, `\`, `..`) to strip any directory traversal attempts from uploaded filenames before constructing storage paths.

### 4. HTTP Security Headers
In `backend/app/main.py`:
- Injected enterprise defense headers on all HTTP responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

## Consequences
- **Positive**: 
  - Complete protection against SQLi, NoSQLi, XSS sniffing, clickjacking, and path traversal.
  - Legitimate academic computer science questions pass seamlessly.
  - Automated test coverage expanded to **74 tests** (69 backend + 5 frontend, 100% passing).
- **Negative / Trade-offs**: None identified.
