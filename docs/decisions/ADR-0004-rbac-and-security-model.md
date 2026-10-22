# ADR-0004: Role-Based Access Control (RBAC) and Security Foundation

## Status
Accepted

## Context
Educational institutions require multi-level data segregation (e.g., student vs. faculty vs. department administrator vs. platform administrator). Per OWASP ASVS 4.1, authorization cannot be trusted to frontend parameter filtering or UI visibility toggles.

## Decision
1. **Server-Enforced Authorization:**
   Every sensitive endpoint is guarded by FastAPI dependency injection (`require_permission`, `require_role`).
2. **Standardized Identity Roles:**
   - `platform_admin`: Institutional oversight across all departments.
   - `dept_admin`: Administers specific department resources.
   - `faculty`: Academic policy access and course document contribution.
   - `student`: Read-only access to published student materials.
3. **Stateless JWT Tokens & Explicit Authentication:**
   JWT bearer authentication using HMAC-SHA256 with cryptographically signed claims. In compliance with enterprise access control standards, live role-switching inside an active session without authenticating is strictly disabled. Users must authenticate with individual credentials. The login portal offers pre-fill persona shortcuts for evaluators without bypassing password verification.
4. **Audit Logging:**
   All authentication attempts, role modifications, and authorization failures emit structured audit events.

## Consequences
- **Positive:** Zero client-side authorization bypass; true session isolation; auditable actions; strict compliance with OWASP ASVS standards.
- **Negative:** Requires fine-grained permission checks on every new API endpoint created in future milestones.
