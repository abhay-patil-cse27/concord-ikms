@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo   CONCORD IKMS — Institutional Knowledge Management System (One-Click Launch)
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking environment & virtualenv...
if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment not found in .venv! Creating virtualenv...
    python -m venv .venv
    echo Installing backend dependencies...
    .venv\Scripts\pip install -r backend\requirements.txt
) else (
    echo Virtual environment verified at .venv
)

echo [2/3] Checking Node modules for Frontend...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend && npm install && cd ..
) else (
    echo Frontend dependencies verified.
)

echo [3/3] Starting CONCORD Backend & Frontend Services...

REM Launch Backend FastAPI ASGI on Port 8000
start "CONCORD Backend (Port 8000)" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

REM Launch Frontend Vite SPA on Port 5173
start "CONCORD Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==============================================================================
echo   CONCORD Services Launched Successfully!
echo   - Backend API: http://127.0.0.1:8000/docs
echo   - Frontend UI: http://localhost:5173
echo ==============================================================================
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
