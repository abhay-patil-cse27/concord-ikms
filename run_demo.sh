#!/bin/bash
set -e

echo "=============================================================================="
echo "  CONCORD IKMS — Institutional Knowledge Management System (One-Click Launch)"
echo "=============================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. Python virtualenv
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r backend/requirements.txt
fi

# 2. Node modules
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && npm install)
fi

echo "Starting Backend (FastAPI :8000)..."
(cd backend && ../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

echo "Starting Frontend (Vite :5173)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Services running! Press Ctrl+C to terminate both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
