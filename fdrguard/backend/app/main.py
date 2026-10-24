import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FDRGuard API", version="0.1.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "fdrguard-api", "version": app.version}


# TODO (feat/api-*): implement the routes in docs/API_CONTRACT.md one at a time.
# Each response must match the JSON in frontend/src/mocks/*.js exactly.
