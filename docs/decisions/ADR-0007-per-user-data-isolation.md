# ADR-0007: Per-User Data Isolation and Broken Object-Level Authorization (BOLA) Prevention

## Status
**Accepted and Implemented**

## Context
In institutional knowledge environments, users across diverse organizational hierarchies (Platform Administrators, Deans / HODs, Faculty Members, and Students) interact with conversational inquiry threads, departmental circulars, and system records.

Prior to this architecture decision:
1. Conversation threads and dialogue turns in Grounded Q&A lacked an explicit data isolation policy layer.
2. In route handlers, thread access checks allowed `platform_admin` to view any user's conversation sessions.
3. Access denial raised HTTP `403 Forbidden`, permitting malicious actors to probe and enumerate valid resource IDs.
4. Client-side browser caches (`uiCache` and `localStorage`) stored queries and thread history globally without user ID namespacing, leading to data leaks across fast user switching or shared workstations.

## Decision

We instituted an end-to-end, multi-tier isolation and authorization architecture following **SOLID principles**:

### 1. Data Model & Storage Layer
- Added `owner_id` (indexed, foreign key to `users.id`) and `visibility` (`private`, `department`, `public`) to `conversations`.
- Added `owner_id` (indexed, foreign key to `users.id`) to `conversation_messages`.
- Added `owner_id` (indexed) and `visibility` (`department`, `public`) to `documents`.
- Provided Alembic migration `0002_user_data_isolation.py` with automatic backfill of existing rows.

### 2. SOLID Authorization Layer (`backend/app/core/access/`)
- **Single Responsibility**: Dedicated access policy module separating authorization rules from routing and business services.
- **Interface Segregation**: Fine-grained interfaces (`Readable`, `Writable`, `Deletable`) and `ResourcePolicy` abstract base class.
- **Open/Closed**: New resources implement `ResourcePolicy` without altering existing policy logic.
- **Liskov Substitution**: Any policy instance is interchangeable wherever `ResourcePolicy` is expected.
- **Dependency Inversion**: Endpoints declare policy dependencies injected via FastAPI `Depends()`.

### 3. Anti-Enumeration Principle (404 Not Found)
When a user attempts to access an object they do not own or are unauthorized to read, the system **strictly returns HTTP 404 (Not Found)** rather than HTTP 403 (Forbidden). This completely eliminates object-level enumeration and ID probing.

### 4. Admin Audit Privacy Constraint
Platform Administrators possess global institutional governance capabilities over system health and configuration, but **DO NOT have read access to private user chat dialogues**. Administrators can only inspect high-level aggregated audit metrics (action types, timestamps, latency).

### 5. Frontend Cache Isolation
- `uiCache` keys are strictly namespaced with the active user ID (`${baseKey}_user_${userId}`).
- All cached session queries and thread histories are cleared upon logout and demo-persona transitions.

## Role-by-Resource Access Matrix

| Resource | Action | Platform Admin | Department Admin (HOD) | Faculty | Student | Anonymous |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Conversations** | List / Read | Own only | Own only | Own only | Own only | Deny (401) |
| **Conversations** | Create / Update | Own only (Token-bound) | Own only (Token-bound) | Own only (Token-bound) | Own only (Token-bound) | Deny (401) |
| **Conversations** | Delete | Own only (404 for others) | Own only (404 for others) | Own only (404 for others) | Own only (404 for others) | Deny (401) |
| **Documents (Dept)** | Read / Download | All | Own Dept only | Own Dept only | Own Dept only | Deny (401) |
| **Documents (Public)**| Read / Download | All | All | All | All | Deny (401) |
| **Documents** | Ingest / Lifecycle | Allowed | Own Dept | Own Dept | Deny (403/404) | Deny (401) |
| **Audit Logs** | Read | Allowed | Deny (403) | Deny (403) | Deny (403) | Deny (401) |
| **User Directory** | List | All Users | Own Profile only | Own Profile only | Own Profile only | Deny (401) |
| **Benchmarks** | Trigger Run | Allowed | Deny (403) | Deny (403) | Deny (403) | Deny (401) |

## Consequences
- **Positive:** BOLA vulnerabilities are eliminated across all CRUD endpoints.
- **Positive:** ID enumeration attacks are defeated through uniform 404 responses.
- **Positive:** Shared workstation privacy is guaranteed through user-namespaced browser storage.
