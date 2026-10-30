# ADR-0013: Break-Glass Bypass, Identity Dossier & Global Notification Center

## Status
**Accepted** — Implemented in Milestone 12

## Context
In higher education enterprise governance at Kolhapur Institute of Technology (KIT), while 2-Tier Institutional Onboarding (ADR-0012) ensures that standard applicants cannot gain unauthorized access without departmental or administrative vetting, two operational challenges arise:
1. **Emergency Evaluator & Fast-Track Access:** External auditors (such as NAAC/NBA peer review teams, guest accreditation evaluators, or emergency consultants) frequently require immediate access. Putting them through public signup and awaiting departmental queues hinders operational reviews. In such situations, a mechanism for authorized Platform Administrators to execute a break-glass administrative bypass or perform direct administrative provisioning is necessary, while strictly preserving cryptographic audit trails (OWASP ASVS 4.1 / NIST SP 800-53).
2. **Transparent Identity Verification & Compliance Inspection:** Reviewers (HODs and Platform Admins) require an in-depth applicant dossier to inspect credentials (domain validation, PRN formatting, department affiliation) before executing clearance actions. Concurrently, every authenticated user must have access to their official institutional credential card, and all users require real-time institutional notifications and clearance alerts.

## Decision

1. **Database Schema Extension (Alembic Revision 0004):**
   - Added `is_bypassed: bool` (default `false`) and `bypass_reason: str (nullable)` to the `users` table.
   - Synchronized across development SQLite targets and production database migration chains.

2. **Break-Glass Emergency Clearance Action (`action: "bypass"`):**
   - Extended `review_user_approval()` in `IdentityService`:
     - Restricted exclusively to Platform Superadmins (`platform_admin` / `superadmin`).
     - Requires an explicit, non-empty administrative justification (`reason`).
     - Automatically clears the user into `approved` state, sets `is_active = True`, records `is_bypassed = True`, and registers the bypass reason.
     - Logs event `USER_APPROVAL_BYPASS` to the tamper-evident SHA-256 audit ledger with actor details and administrative reason.

3. **Direct User Provisioning (`POST /api/v1/governance/users/provision-direct`):**
   - Enables Platform Administrators and Department Heads (scoped to their department) to directly create pre-cleared, activated user accounts.
   - Bypasses public registration queues while assigning appropriate roles, department membership, and recording `USER_DIRECT_PROVISION` audit events.

4. **Universal Institutional Digital ID Card (`UserProfileModal.jsx`):**
   - Accessible to all authenticated users via the `Navbar` user dropdown.
   - Displays student PRN / staff Employee ID, verified institutional email, department affiliation, role badge, granted ASVS L2 permission scopes, session fingerprint, and active cryptographic protocols in high-voltage Yellow Brutalist styling.

5. **Applicant Verification Dossier (`ApplicantDossierModal.jsx`):**
   - Surfaces full applicant metadata, automated compliance checks (institutional domain regex, PRN format validation, registration timestamp), and direct clearance controls (`[Approve]`, `[Reject With Reason]`, `[⚡ Admin Bypass]`).

6. **Global Notification Center (`NotificationDrawer.jsx`):**
   - Integrated into [`Navbar.jsx`](file:///c:/Users/Admin/Desktop/IKMS/IKMS/frontend/src/components/Navbar.jsx) with a header Bell icon and dynamic unread counter badge.
   - Displays real-time pending applicant clearance alerts (for HODs/Admins with direct queue navigation), institutional bulletins, and system security status dispatches.

7. **Dual-Approval Rule for Students:**
   - Formalized and verified that student applicants can be verified and approved **either** by their Department HOD or directly by the Platform Superadmin (who maintains global college-wide clearance authority).

## Consequences
- **Positive:**
  - Zero disruption during accreditation peer reviews or emergency administrative appointments.
  - Complete transparency and verification for reviewing authorities via compliance dossiers.
  - Full cryptographic audit accountability for all bypassed and directly provisioned accounts.
  - Reusable, modular Yellow Brutalist components without code duplication.
- **Negative:**
  - Administrative bypass requires strict role security to prevent privilege abuse (enforced via server-side RBAC guardrails).
