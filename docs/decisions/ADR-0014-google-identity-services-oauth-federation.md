# ADR-0014: Google Identity Services (OAuth 2.0 / OpenID Connect) Federation & Dual-Mode Login

## Status
**Accepted** — Implemented in Milestone 14

## Context
At Kolhapur Institute of Technology (KIT), the official institutional domain (`@kitcoek.in`) is hosted directly on Google Workspace for Education. Concurrently, personal Google accounts (`@gmail.com`) are frequently used by applicants, external collaborators, and incoming students. 

To provide high convenience, reduced password fatigue, and automated identity verification:
1. **Google Identity Single Sign-On (SSO):** Enrolled students, faculty, and administrators should be able to authenticate with a single click using their verified Google identity.
2. **Credential Parity (Dual-Mode Authentication):** Campus LAN operations, offline testing environments, and users who prefer manual credentials must continue to support standard email and password authentication with zero disruption.
3. **Institutional Field Gaps:** Google OpenID Connect profiles supply `email`, `name`, `sub`, and `picture`, but cannot provide college-specific academic data: **Permanent Registration Number (PRN / Employee ID)** and **Academic Department affiliation**. Therefore, an un-registered Google user must be securely bridged into the institutional onboarding flow.
4. **Approval Queue Enforcement:** Google OAuth must not bypass the college's 2-tier approval workflow (`pending_tier1` for HOD review, `pending_tier2` for Platform Admin review).

## Decision

1. **Lightweight Cryptographic RS256 JWKS Verification (`backend/app/core/google_auth.py`):**
   - Implemented token verification directly via Python `jwt.PyJWKClient` against Google's public certificate endpoints (`https://www.googleapis.com/oauth2/v3/certs`).
   - Verifies token signature, expiration (`exp`), issuer (`accounts.google.com`), audience (`GOOGLE_CLIENT_ID`), and `email_verified` claim.
   - **Zero New Dependencies:** Avoids heavy multi-megabyte Google API SDKs by utilizing existing `pyjwt[crypto]>=2.9.0` and `httpx>=0.27.0`.

2. **Deterministic Offline Test Mocking:**
   - Supported offline CI token verification using format `mock-google-token:<email>:<name>:<hd>`.
   - Enables fast, network-independent integration testing in GitHub Actions without external HTTP requests.

3. **Gated 2-Tier Approval Enforcement (`IdentityService.authenticate_google_user`):**
   - If an existing user has `is_active = False`:
     - `pending_tier1`: Raises `HTTP 401 Unauthorized` with Department HOD approval message.
     - `pending_tier2`: Raises `HTTP 401 Unauthorized` with Platform Admin approval message.
     - `rejected`: Raises `HTTP 401 Unauthorized` with recorded rejection reason.

4. **Automated Onboarding Bridge for Unregistered Google Accounts:**
   - When an un-registered user authenticates via Google GIS, `POST /api/v1/auth/google` returns `{"is_registered": false, "email": ..., "full_name": ..., "google_id": ..., "hd": ...}`.
   - The frontend (`App.jsx` and `LoginView.jsx`) automatically transitions the user to `RegisterView` with:
     - Email locked and verified via a `GOOGLE VERIFIED` badge.
     - Full Name pre-populated from the Google profile.
     - User selects Academic Department, enters PRN / Employee ID, and sets an optional account password to enable manual password sign-in.
     - Submission places the account into the standard 2-tier approval queue.

5. **Frontend Yellow Brutalist Google SSO Component (`GoogleSignInButton.jsx`):**
   - Dynamically loads and binds to `window.google.accounts.id` (Google Identity Services).
   - Renders the official GIS button with Google's multi-color SVG icon.
   - Includes graceful offline / adblocker fallback.
   - Whitelists Google authentication origins in `frontend/index.html` Content-Security-Policy (CSP): `script-src`, `connect-src`, and `frame-src` for `https://accounts.google.com`, and `img-src` for `https://lh3.googleusercontent.com` and `https://*.googleusercontent.com`.

6. **Full Credential Parity:**
   - The manual login form with email and password remains 100% active and unimpacted directly below the Google Sign-In button, separated by a visual divider: `"OR CONTINUE WITH EMAIL & PASSWORD"`.

## Consequences
- **Positive:**
  - Complete 1-click Google Single Sign-On for both `@kitcoek.in` Google Workspace and `@gmail.com` accounts.
  - Zero disruption to existing manual email/password login capabilities.
  - Streamlined student onboarding: eliminates manual email typos and verifies Google identity upfront.
  - Fully secured institutional approval governance remains intact.
  - 100% automated test coverage (124 automated scenarios passing).
- **Negative:**
  - Production deployments require setting `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment variables.
