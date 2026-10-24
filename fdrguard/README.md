# FDRGuard

SIH 2026, PS 26265 (AICTE): a financial-instrument lifecycle and compliance engine for security deposits / FDRs. Synthetic data only; bank check, AICTE lien check, SMS and sign-off are simulated.

## Structure
```
fdrguard/
  frontend/   React (Vite) + Tailwind v4 + React Router + Recharts + lucide-react
  backend/    FastAPI (app/main.py)
  docs/       UI_GUIDE.md, API_CONTRACT.md
```

## Run the frontend (mock mode)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Run the backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/api/health
```
Vite proxies `/api` to `http://localhost:8000`.

## Mock-first workflow
The frontend runs on `src/mocks/*.js` while `VITE_USE_MOCK=true`. Backend teammates implement the endpoints in `docs/API_CONTRACT.md` returning identical JSON, then flip endpoints to real one at a time (see `src/api/client.js`).

## Branches
`feat/ui-*` for the UI owner, `feat/api-*` for backend. `main` is protected.

## Next step
Generate screen 1 (app shell: sidebar, top bar, role switcher), then follow the build order in `docs/UI_GUIDE.md`.
