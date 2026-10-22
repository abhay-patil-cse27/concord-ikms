# CONCORD — System Architecture Specification (Milestone 0)

## 1. Architectural Philosophy: Modular Monolith

CONCORD is designed as a **Modular Monolith** with dependency inversion. This provides strict domain boundaries without premature microservice distributed-system complexity.

```
+-------------------------------------------------------------------------+
|                           PRESENTATION LAYER                            |
|          React (Vite) + Vanilla CSS Design System (Inter, Dark UI)      |
|           Auth Context | Dashboard | Search | Documents | Admin         |
+------------------------------------+------------------------------------+
                                     | HTTPS / JSON API contracts
+------------------------------------v------------------------------------+
|                         BACKEND API & APPLICATION                       |
|                             FastAPI (Python 3.12)                       |
|  - API Gateway / Router v1 (/api/v1/health, /api/v1/auth, /api/v1/admin)|
|  - Core Security: Token Verification, RBAC Policy Guard, ASVS Checks    |
|  - Structured Error Handlers, Correlation IDs, Structured Logger        |
+--------------------+---------------------+--------------------+---------+
                     |                     |                    |
        +------------v-----------+  +------v-------+  +---------v------+
        |   Identity & Tenancy   |  | Organization |  |  Audit Engine  |
        |  Users, Roles, Perms   |  | Departments  |  | Security Logs  |
        +------------------------+  +--------------+  +----------------+
                     |                     |                    |
+--------------------v---------------------v--------------------v---------+
|                              DATA LAYER                                 |
|          SQLAlchemy 2.0 (Async) + Alembic Schema Migrations             |
|                 PostgreSQL 16 + pgvector / Full-Text Search             |
|                 (SQLite supported for isolated unit tests)              |
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
4. **Provider Abstraction Layer:**
   External capabilities (Storage, LLMs, Embeddings, OCR) are abstracted behind abstract base classes (Dependency Inversion).
