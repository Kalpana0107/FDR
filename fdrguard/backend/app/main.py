from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.auth import router as auth_router
from .api.fdr import router as fdr_router
from .api.institutions import router as institutions_router
from .api.audit_chain import router as audit_chain_router
from .api.bank_verify import router as bank_verify_router
from .api.demo_clock import admin_router as demo_clock_router, reminder_router
from .api.release import router as release_router
from .api.versions_receipts import router as versions_receipts_router
from .api.analytics import router as analytics_router

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
app.include_router(audit_chain_router, prefix="/api")
app.include_router(bank_verify_router, prefix="/api")
app.include_router(demo_clock_router, prefix="/api")
app.include_router(reminder_router, prefix="/api")
app.include_router(release_router, prefix="/api")
app.include_router(versions_receipts_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
