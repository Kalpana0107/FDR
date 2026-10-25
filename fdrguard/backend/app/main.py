from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.auth import router as auth_router
from .api.fdr import router as fdr_router
from .api.institutions import router as institutions_router

app = FastAPI(
    title="FDR Guard — AICTE Security Deposit Portal",
    description="API for managing Fixed Deposit Receipt (FDR) records submitted to AICTE.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(fdr_router, prefix="/api")
app.include_router(institutions_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
