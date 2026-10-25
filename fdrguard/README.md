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

## 1. Run the Backend

Navigate to the `backend/` directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
# Create venv
python -m venv venv

# Activate venv:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000
```
- API Health check: http://localhost:8000/api/health
- Swagger UI Documentation: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

---

## 2. Run the Frontend

Navigate to the `frontend/` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm i
```

Start the Vite development server:
```bash
npm run dev
```
- The frontend will be available at: http://localhost:5173
- Vite automatically proxies `/api` requests to the backend at http://localhost:8000.

To create a production build:
```bash
npm run build
```

---

## 3. Database with Docker Compose (Optional / Local Dev)

To start the PostgreSQL database container:
```bash
cd fdrguard
docker compose up -d
```

Initialize tables and seed mock data:
```bash
cd backend
python init_db.py
python seed.py
```
