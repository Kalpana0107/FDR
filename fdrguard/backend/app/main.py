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

from fastapi import Depends, UploadFile, File
from sqlalchemy.orm import Session
from .core.database import get_db
from .core.deps import get_current_user
from .models.user import User
from .services.duplicate_service import detect_all_duplicates
from .services.renewal_service import calculate_active_metrics
from .services.ocr_service import extract_fdr_from_pdf
from .services.storage import validate_upload
from .schemas.fdr import OCRScanResponse

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


@app.get("/api/duplicates", tags=["Duplicates"])
def get_duplicates_top_level(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cross-college and system-wide duplicate detection."""
    return detect_all_duplicates(db)


@app.get("/api/dashboard/summary", tags=["Dashboard"])
def get_dashboard_summary_top_level(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard totals ensuring renewals count once."""
    return calculate_active_metrics(db)


@app.post("/api/ocr/scan", response_model=OCRScanResponse, tags=["OCR"])
async def scan_ocr_pdf_top_level(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """OCR extraction reading FDR number, bank, amount, dates from PDF."""
    raw = await file.read()
    validate_upload(raw, file.filename or "fdr_certificate.pdf")
    res = extract_fdr_from_pdf(raw)
    return OCRScanResponse(**res)
