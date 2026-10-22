# CONCORD — Institutional Knowledge Management System (IKMS)

> **Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Trust-Aware Institutional Intelligence**  
> *Mega Project 2026–27 — Kolhapur Institute of Technology (KIT)*

---

## 1. Overview & Architecture

CONCORD is built as a high-integrity institutional knowledge platform designed to unify scattered institutional policies, circulars, department records, and syllabi, providing verifiable, auditable answers with cryptographic provenance.

### Core Architecture (Modular Monolith)

- **Presentation Layer:** React (Vite) + Vanilla CSS bespoke institutional design system with Inter & Outfit typography, live health monitoring, and demo role quick-switcher.
- **Application & API Layer:** Python 3.12 + FastAPI with versioned routes (`/api/v1`), Pydantic Settings, structured JSON logging, correlation IDs (`X-Request-ID`), and standardized error envelopes.
- **Security & RBAC:** Native Bcrypt password hashing, stateless HMAC-SHA256 JWT tokens, and server-enforced role and permission dependency injection guards adhering to **OWASP ASVS 4.1**.
- **Data & Migration Layer:** SQLAlchemy 2.0 Async engine with Alembic schema migrations, supporting PostgreSQL 16 + pgvector for production/Docker Compose and lightweight SQLite for local/offline unit test isolation.

---

## 2. Directory Layout

```
IKMS/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # HTTP endpoints: health, auth, users, organizations, audit
│   │   ├── core/            # Config, security, database, errors, logging, seed
│   │   ├── modules/
│   │   │   ├── identity/    # Users, Roles, Permissions, UserRoles, RolePermissions
│   │   │   ├── organizations/# Departments, Memberships
│   │   │   └── audit/       # Tamper-evident Audit Events
│   │   └── main.py          # FastAPI application & lifecycle hooks
│   ├── alembic/             # Database migration environment & versions
│   ├── tests/               # Pytest automated test suite (14 test cases)
│   ├── requirements.txt     # Pinned Python dependencies
│   └── alembic.ini          # Migration configuration
├── frontend/
│   ├── src/
│   │   ├── api/             # Centralized API client (fetch wrapper)
│   │   ├── context/         # AuthContext & token management
│   │   ├── components/      # Navbar, Sidebar, HealthCard
│   │   └── views/           # DashboardView, LoginView, DepartmentsView, UsersView, AuditLogsView
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── PROJECT_BRIEF.md     # Primary engineering specification
│   ├── architecture/        # Repository assessment, system architecture, data model, backlog
│   └── decisions/           # Architecture Decision Records (ADR-0001 to ADR-0004)
├── infra/docker/            # Backend and Frontend Dockerfiles
├── docker-compose.yml       # Reproducible containerized local development stack
├── .env.example             # Documented environment template
└── README.md
```

---

## 3. Quickstart: Local Development Setup

### Option A: Local Native Development (Recommended for fast offline iteration)

#### 1. Backend Setup
```bash
# 1. Activate virtual environment
.\.venv\Scripts\activate

# 2. Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# 3. Apply database migrations
alembic -c backend/alembic.ini upgrade head

# 4. Start backend server (port 8000)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
# In a separate terminal:
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: Containerized Setup via Docker Compose

```bash
# Ensure Docker Desktop is running, then launch all services:
docker compose up --build
```
This starts:
- `concord-postgres`: PostgreSQL 16 + pgvector on port `5432`
- `concord-minio`: MinIO S3 object storage on ports `9000` and `9001`
- `concord-backend`: FastAPI application on port `8000`
- `concord-frontend`: React Vite application on port `5173`

---

## 4. Pre-Seeded Personas & Demo Accounts

For rapid viva and evaluator demonstration, the system automatically initializes with pre-seeded institutional personas:

| Persona | Role Code | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Administrator** | `platform_admin` | `admin@concord.kit.edu` | `Admin@12345` | Global Institutional Oversight |
| **Department Admin (HOD CSE)** | `dept_admin` | `deptadmin.cse@concord.kit.edu` | `Dept@12345` | Department: `CSE` |
| **Faculty Member** | `faculty` | `faculty.cse@concord.kit.edu` | `Faculty@12345` | Department: `CSE` |
| **Enrolled Student** | `student` | `student.cse@concord.kit.edu` | `Student@12345` | Department: `CSE` |

*Note: You can switch between these personas instantly using the "Switch Role" pills in the top navbar.*

---

## 5. Running Automated Tests

Run the complete backend test suite:
```bash
.\.venv\Scripts\pytest -v backend/tests
```
- **Test Coverage Includes:**
  - `/api/v1/healthz` and `/api/v1/readyz` probe liveness and DB connectivity.
  - Password login verification and invalid credential 401 rejections.
  - Demo role authentication and session management.
  - Server-side RBAC validation: ensuring students and faculty are rejected (403 Forbidden with standard error envelopes) from accessing restricted user management and audit log endpoints.
  - Document ingestion lifecycle: multipart file upload, SHA-256 deduplication, sliding-window chunking, raw file download, and document deletion.
  - Document format parsers: text, markdown, PDF (`pypdf`), and DOCX (`python-docx`).

---

## 6. Milestone Acceptance Status

- **Milestone 0 (Discovery & Baseline):** Completed (Audited repository, ADR-0001 through ADR-0004, system architecture, relational data model, risk register, prioritized backlog).
- **Milestone 1 (Platform Foundation):** Completed (Frontend & backend startup, config management, DB migrations, health probes, structured logging, error envelopes, and RBAC security foundation).
- **Milestone 2 (Document Ingestion, Parsing & Chunking Engine):** Completed (Storage provider abstraction, PDF/DOCX/TXT parsers, sliding-window chunker, cryptographic provenance, document upload/preview/chunk inspection UI, and full test suite).
- **Next Milestone (Milestone 3):** Hybrid Search & Retrieval Engine (Full-text keyword matching + vector similarity, Reciprocal Rank Fusion, token-bounded candidate reranking, and department-scoped access filtering).

---

## 7. Engineering & Architectural Standards

All ongoing and upcoming developments adhere to industry-standard patterns:
- **Modular Monolith & Clean Boundaries:** Modules (`identity`, `organizations`, `documents`, `audit`, `retrieval`) retain strict encapsulation with isolated models, schemas, and services.
- **Provider Strategy Pattern:** Swappable interfaces for storage, embeddings, and vector stores allowing seamless offline development (SQLite / local embeddings) and scalable production deployment (PostgreSQL + `pgvector` / MinIO).
- **Reusable Frontend Design System:** Modular React UI components and custom hooks avoiding inline redundancies and enforcing consistent institutional styling tokens.
- **Security & Integrity First:** Cryptographic verification (SHA-256 content hashing), OWASP ASVS 4.1 compliant RBAC dependency guards, and comprehensive audit trail logging.
