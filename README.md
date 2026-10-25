# FDRGuard

SIH 2026, PS 26265 (AICTE): A unified financial-instrument lifecycle and compliance portal for Fixed Deposit Receipts (FDR) / security deposits submitted to AICTE.

## Repository Structure
```
fdrguard/
  backend/            FastAPI backend with SQLAlchemy models, auth, and FDR endpoints
  frontend/           React (Vite) + Tailwind CSS frontend with interactive dashboard
  docs/               API_CONTRACT.md, UI_GUIDE.md
  docker-compose.yml  PostgreSQL database service
```

## Ports Overview
| Service | Port | URL |
|---------|------|-----|
| **Backend API** | `8000` | http://localhost:8000 (Docs: http://localhost:8000/api/docs, Health: http://localhost:8000/api/health) |
| **Frontend** | `5173` | http://localhost:5173 |
| **Database (PostgreSQL)** | `5432` | localhost:5432 |

---

## Quick Start Guide

### 1. Run Backend (Port 8000)

```bash
cd fdrguard/backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
- API Docs: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/api/health

---

### 2. Run Frontend (Port 5173)

```bash
cd fdrguard/frontend

# Install dependencies
npm i

# Start dev server
npm run dev
```
- Available at: http://localhost:5173
- Vite proxies `/api` calls to `http://localhost:8000`.

---

### 3. Database with Docker Compose (PostgreSQL)

```bash
cd fdrguard
docker compose up -d
```
Spins up PostgreSQL container on port `5432`.