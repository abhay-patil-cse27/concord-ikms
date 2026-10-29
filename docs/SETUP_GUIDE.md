# CONCORD IKMS — Comprehensive Developer & Evaluator Setup Guide

> **Context-Oriented Cognitive Memory Layer for Multi-Source Knowledge Integration, Adaptive Retrieval, and Trust-Aware Institutional Intelligence**  
> *Mega Project 2026–27 — Kolhapur Institute of Technology (KIT)*

[← Back to Main README](../README.md#📚-documentation-index) • [API Reference](API_DOCUMENTATION.md) • [Testing Reference](TESTING_DOCUMENTATION.md)

---

## 1. System Requirements & Prerequisites

Before starting, ensure your workstation has the following installed:

| Tool | Minimum Version | Recommended | Purpose |
| :--- | :--- | :--- | :--- |
| **Python** | `3.11.x` | `3.11.9` or `3.12.x` | Backend runtime & asynchronous ASGI server |
| **Node.js** | `18.x` | `20.x` LTS | Frontend Vite compilation & React presentation |
| **Git** | `2.x` | Latest | Version control & repository synchronization |
| **Ollama** *(Optional)* | `0.3.x+` | Latest | For 100% offline, air-gapped on-premises local LLM execution |
| **Groq API Key** *(Optional)* | N/A | Free tier | For sub-200ms cloud inference (`llama-3.3-70b` / `gpt-oss-120b`) |

> [!NOTE]
> **Zero Hardware Barrier:** An expensive GPU is **NOT required**. The entire system runs smoothly on standard consumer laptops with 8 GB RAM on CPU.

---

## 2. Fast 5-Minute Quickstart

### Step 1: Clone the Repository
```bash
git clone https://github.com/abhay-patil-cse27/concord-ikms.git
cd concord-ikms
```

### Step 2: Configure Environment Variables
Copy the template `.env.example` into `.env` at the project root:
```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# Linux / macOS (Bash):
cp .env.example .env
```

*(Optional)* If you have a free Groq API Key from [console.groq.com](https://console.groq.com/keys), open `.env` and paste it:
```env
GROQ_API_KEY="gsk_your_actual_key_here"
```
*(If you leave `GROQ_API_KEY=""` empty, CONCORD still works 100% using its built-in deterministic extractive synthesizer fallback or local Ollama!)*

---

### Step 3: Backend Setup & Initialization

Open a terminal in the `backend/` directory:

```bash
cd backend

# 1. Create and activate a Python virtual environment
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\activate

# Linux / macOS (Bash):
source .venv/bin/activate

# 2. Install pinned dependencies (takes ~1-2 minutes)
pip install -r requirements.txt

# 3. Initialize relational SQLite schema via Alembic migrations
python -m alembic upgrade head

# 4. (Recommended) Seed rich multi-department institutional documents and ChromaDB vectors
python scripts/seed_demo_data.py

# 5. Start the FastAPI development server with auto-reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Once started, the backend is live at:
- **API Base:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Specification:** `http://127.0.0.1:8000/redoc`

---

### Step 4: Frontend Setup & Startup

Open a **second terminal** in the `frontend/` directory:

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite React development server
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 3. Pre-Seeded Evaluator Personas (1-Click Switcher)

For instant viva and demonstration evaluation without typing credentials, click the **"Switch Role"** pill in the top navbar:

| Persona | Role Code | Email | Password | Granted Scope & Boundaries |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Administrator** | `platform_admin` | `admin@concord.kit.edu` | `Admin@12345` | Global oversight, Dual-Mode LLM hot-swap, audit logs, system benchmarks. |
| **Department Admin (HOD CSE)** | `dept_admin` | `deptadmin.cse@concord.kit.edu` | `Dept@12345` | HOD document approval queue, CSE department policy management. |
| **Faculty Member** | `faculty` | `faculty.cse@concord.kit.edu` | `Faculty@12345` | Verified academic syllabus queries, document upload proposals. |
| **Enrolled Student** | `student` | `student.cse@concord.kit.edu` | `Student@12345` | Grounded academic queries, exam regulations, attendance criteria. |

---

## 4. Dual-Mode LLM Configuration Guide

CONCORD supports **two swappable inference paradigms** with zero server restarts:

```
                      +---------------------------------+
                      |     Dynamic Runtime Factory     |
                      |    (get_llm_provider in RAM)    |
                      +----------------+----------------+
                                       |
                 +---------------------+---------------------+
                 |                                           |
    [MODE 1: Cloud API (Groq)]             [MODE 2: On-Premises Local Node]
    - Model: llama-3.3-70b / 120b          - Model: qwen2.5:1.5b (~1.2 GB RAM)
    - Latency: <200ms TTFT                 - Engine: Ollama / vLLM / LAN PC
    - Connectivity: Internet               - Connectivity: 100% Offline Air-Gapped
```

### Option A: Cloud Mode (Default)
1. Ensure your `.env` contains:
   ```env
   LLM_PROVIDER_MODE="cloud"
   GROQ_API_KEY="gsk_..."
   ```
2. Queries stream in real-time with sub-200ms latency.

### Option B: On-Premises Local Mode (Ollama)
1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Pull the ultra-lightweight institutional default model:
   ```bash
   ollama run qwen2.5:1.5b
   ```
   *(This downloads ~1.2 GB and runs at 25–35 tokens/sec entirely on CPU with zero thermal throttling).*
3. **Hot-Swap via UI (No Server Restart Needed):**
   - Log in as **Platform Admin** (`admin@concord.kit.edu`).
   - Go to **Overview (Dashboard)**.
   - In the **Dual-Mode LLM Engine Controller**, click the **LOCAL / REMOTE NODE** segmented toggle.
   - Click **TEST PROBE** (verifies reachability and checks latency).
   - Click **SAVE CONFIGURATION**.
4. Every chat and search query now runs through your local Ollama node!

### Option C: Offline Synthesizer Fallback (Zero Config)
If neither Groq nor Ollama is running, CONCORD automatically falls back to its deterministic extractive synthesizer. Responses are formulated directly from verified ChromaDB chunks with clickable citations `[1]`.

---

## 5. Running Automated Verification Suites

To verify that everything is working properly on your machine:

### 1. Run Backend Pytest Suite (85 Scenarios)
From the `backend/` directory with virtual environment activated:
```bash
pytest tests/ -v
```
*(All 85 tests run offline and pass with 100% green).*

### 2. Run Frontend Isolation & Sanitization Tests (9 Scenarios)
From the `frontend/` directory:
```bash
npm test
```
*(Verifies cache namespacing, user switching isolation, and speech regex sanitization).*

### 3. Verify Frontend Production Build
```bash
npm run build
```
*(Verifies tree-shaking, CSS optimization, and zero bundling errors).*

---

## 6. Troubleshooting & FAQs

### Q1: `Execution of scripts is disabled on this system` (PowerShell on Windows)
**Fix:** Run PowerShell as Administrator or allow process-scoped script execution:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\activate
```

### Q2: Port 8000 or Port 5173 is already in use
**Fix:** Specify an alternative port:
```bash
# Backend alternative:
python -m uvicorn app.main:app --port 8001 --reload

# Frontend alternative:
npm run dev -- --port 5174
```

### Q3: Tesseract OCR is not installed
**Fix:** Tesseract is **optional**. CONCORD includes `GracefulFallbackOCRProvider`. If a scanned PDF or circular image is uploaded without Tesseract installed on your system, the system extracts available text metadata and logs a graceful notice without crashing.

### Q4: How do I reseed the database to clean demo state?
- **Option 1:** Log in as `Platform Admin` and click the **"RESEED DEMO"** button in the top right.
- **Option 2:** Run `python scripts/seed_demo_data.py` from the `backend/` folder.
