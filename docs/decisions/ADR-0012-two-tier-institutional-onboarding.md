# ADR-0012: 2-Tier Institutional User Onboarding & Approval Queue

## Status
**Accepted** — Implemented in Milestone 12

## Context
In higher education institutions like Kolhapur Institute of Technology (KIT), self-service signups cannot grant immediate unfettered access to internal academic syllabi, institutional circulars, or computational resources without authorization. Students possess PRNs (Permanent Registration Numbers) and staff possess institutional Employee IDs that must be verified against academic department rosters.

Furthermore, an authorization hierarchy is required:
1. **Department Scope (Tier 1):** Department Heads (HODs) are responsible for verifying students and faculty within their respective academic departments (CSE, AIML, DS, ENTC, EE, ME, CE, BT, BSH). An HOD of Computer Science should never have visibility or approval authority over a Mechanical or Civil Engineering applicant (BOLA risk).
2. **Platform Scope (Tier 2):** Institutional Platform Administrators (e.g. Dean of Academics / Registrar) must oversee department head appointments, examine college-wide governance, and authorize Tier 2 escalations.

## Decision
1. **Database Schema Extension:**
   - Added `approval_status` enum/string column on `User` (`approved`, `pending_tier1`, `pending_tier2`, `rejected`).
   - Added `registration_number` (student PRN or employee ID) for external roster reconciliation.
   - Added audit tracking fields: `tier1_approved_by`, `tier2_approved_by`, and `rejection_reason`.
   - Migration managed via Alembic revision `0003_user_onboarding_approval.py`.

2. **Self-Registration Routing:**
   - Public endpoint `POST /api/v1/auth/register` creates accounts in an unapproved state:
     - `student` / `faculty` $\rightarrow$ `pending_tier1`
     - `dept_admin` (HOD) $\rightarrow$ `pending_tier2`
   - Pre-seeded users (demo accounts) default to `approved`.
   - Public endpoint `GET /api/v1/auth/departments` exposes academic department choices for registration dropdowns without weakening authenticated RBAC on internal admin APIs.

3. **Strict Authentication Gate:**
   - `authenticate_user()` checks `approval_status`. Any unapproved account attempting to log in receives an explicit HTTP 403 refusal specifying their current verification stage (`pending_tier1`, `pending_tier2`, or `rejected` with the logged reason).

4. **Tenant-Isolated Approval & Review APIs:**
   - `GET /api/v1/governance/pending-users`:
     - Department Admin (`dept_admin`) is strictly filtered by `user.department_id`, returning only their department's Tier 1 applicants.
     - Platform Admin (`platform_admin`) accesses college-wide applicants.
   - `POST /api/v1/governance/users/{id}/review`:
     - Guards against cross-tenant actions: if an HOD attempts to approve/reject an applicant belonging to another department, the service immediately throws `ForbiddenError` (BOLA prevention).
     - Approvals update `approval_status = "approved"`.
     - Rejections record `rejection_reason` and transition status to `"rejected"`.

5. **Yellow Brutalist Presentation Layer:**
   - `RegisterView.jsx`: High-voltage registration modal with dynamic department loading, PRN format validation, and status confirmation.
   - `UserApprovalQueue.jsx`: Integrated within `UsersView.jsx` and surfaced via quick alert banner in `DashboardView.jsx`. Features one-click approvals, modal-based rejection with mandatory audit reason capture, and real-time pending badges.

## Consequences
- **Positive:**
  - Zero unverified access to college knowledge base.
  - Complete compliance with institutional governance and OWASP ASVS 4.1 BOLA prevention.
  - Zero regression across all 101 automated test cases.
- **Negative:**
  - Self-registered users cannot immediately access RAG search until their department HOD reviews their submission.

