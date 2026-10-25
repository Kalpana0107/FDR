"""
FDR records API — college user endpoints.
"""
import math
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..core.deps import get_current_user, get_current_admin
from ..models.user import User, UserRole
from ..models.fdr import FDRRecord, FDRStatus
from ..models.document import Document
from ..models.audit import StatusHistory
from ..schemas.fdr import (
    FDRCreate, FDRUpdate, FDRListItem, FDRDetail,
    AdminStatusUpdate, CollegeDashboardStats, AdminDashboardStats, PaginatedFDRList
)
from ..schemas.audit import StatusHistoryOut
from ..schemas.document import DocumentOut
from ..services.fdr_service import (
    generate_application_id, transition_status, add_audit_event
)
from ..services.storage import storage_service, validate_upload
from ..core.deps import ADMIN_ROLES

router = APIRouter(prefix="/fdr", tags=["FDR Records"])


def _build_fdr_list_item(record: FDRRecord) -> FDRListItem:
    item = FDRListItem.model_validate(record)
    if record.institution:
        item.institution_name = record.institution.name
    return item


def _build_fdr_detail(record: FDRRecord) -> FDRDetail:
    detail = FDRDetail.model_validate(record)
    if record.institution:
        detail.institution_name = record.institution.name
    if record.submitted_by_user:
        detail.submitted_by_name = record.submitted_by_user.full_name
    detail.documents = [DocumentOut.model_validate(d) for d in record.documents]
    history_items = []
    for h in record.status_history:
        sh = StatusHistoryOut.model_validate(h)
        if h.actor:
            sh.actor_name = h.actor.full_name
        history_items.append(sh)
    detail.status_history = history_items
    return detail


# ─────────────────────────────────────────────
# College dashboard stats
# ─────────────────────────────────────────────
@router.get("/stats/college", response_model=CollegeDashboardStats)
def college_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Use admin stats endpoint")
    if not current_user.institution_id:
        return CollegeDashboardStats(total=0, draft=0, submitted=0, under_review=0, returned=0, verified=0, rejected=0)

    q = db.query(FDRRecord).filter(FDRRecord.institution_id == current_user.institution_id)
    total = q.count()

    def count_status(s):
        return q.filter(FDRRecord.status == s).count()

    return CollegeDashboardStats(
        total=total,
        draft=count_status(FDRStatus.DRAFT),
        submitted=count_status(FDRStatus.SUBMITTED),
        under_review=count_status(FDRStatus.UNDER_REVIEW),
        returned=count_status(FDRStatus.RETURNED),
        verified=count_status(FDRStatus.VERIFIED),
        rejected=count_status(FDRStatus.REJECTED),
        active=count_status(FDRStatus.ACTIVE),
        maturing=count_status(FDRStatus.MATURING),
        released=count_status(FDRStatus.RELEASED),
        withdrawn=count_status(FDRStatus.WITHDRAWN),
    )


# ─────────────────────────────────────────────
# Admin dashboard stats
# ─────────────────────────────────────────────
@router.get("/stats/admin", response_model=AdminDashboardStats)
def admin_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    def count_status(s):
        return db.query(FDRRecord).filter(FDRRecord.status == s).count()

    total_submitted = db.query(FDRRecord).filter(
        FDRRecord.status != FDRStatus.DRAFT
    ).count()

    return AdminDashboardStats(
        total_submitted=total_submitted,
        awaiting_review=count_status(FDRStatus.SUBMITTED),
        under_review=count_status(FDRStatus.UNDER_REVIEW),
        verified=count_status(FDRStatus.VERIFIED),
        returned=count_status(FDRStatus.RETURNED),
        rejected=count_status(FDRStatus.REJECTED),
    )


# ─────────────────────────────────────────────
# Create FDR (draft)
# ─────────────────────────────────────────────
@router.post("/", response_model=FDRDetail, status_code=status.HTTP_201_CREATED)
def create_fdr(
    payload: FDRCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User has no associated institution")

    institution_id = current_user.institution_id
    app_id = generate_application_id(db)

    record = FDRRecord(
        application_id=app_id,
        institution_id=institution_id,
        submitted_by_id=current_user.id,
        fdr_number=payload.fdr_number,
        bank_name=payload.bank_name,
        branch_name=payload.branch_name,
        amount=payload.amount,
        currency=payload.currency,
        issue_date=payload.issue_date,
        maturity_date=payload.maturity_date,
        purpose=payload.purpose,
        remarks=payload.remarks,
        status=FDRStatus.DRAFT,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    add_audit_event(db, current_user.id, record.id, "fdr_created", {"application_id": app_id})

    db.refresh(record)
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
        joinedload(FDRRecord.documents),
        joinedload(FDRRecord.status_history).joinedload(StatusHistory.actor),
    ).filter(FDRRecord.id == record.id).first()
    return _build_fdr_detail(record)


# ─────────────────────────────────────────────
# Update FDR (only DRAFT or RETURNED)
# ─────────────────────────────────────────────
@router.patch("/{fdr_id}", response_model=FDRDetail)
def update_fdr(
    fdr_id: int,
    payload: FDRUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # College users can only update their own institution's records
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles:
        if record.institution_id != current_user.institution_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if record.status not in (FDRStatus.DRAFT, FDRStatus.RETURNED):
            raise HTTPException(status_code=422, detail="Record cannot be edited in current status")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    # Validate date consistency
    if record.maturity_date <= record.issue_date:
        raise HTTPException(status_code=422, detail="Maturity date must be later than issue date")

    db.commit()
    db.refresh(record)
    add_audit_event(db, current_user.id, record.id, "fdr_updated")

    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
        joinedload(FDRRecord.documents),
        joinedload(FDRRecord.status_history).joinedload(StatusHistory.actor),
    ).filter(FDRRecord.id == fdr_id).first()
    return _build_fdr_detail(record)


# ─────────────────────────────────────────────
# Submit FDR
# ─────────────────────────────────────────────
@router.post("/{fdr_id}/submit", response_model=FDRDetail)
def submit_fdr(
    fdr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")

    record = transition_status(db, record, FDRStatus.SUBMITTED, current_user)
    add_audit_event(db, current_user.id, record.id, "fdr_submitted")

    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
        joinedload(FDRRecord.documents),
        joinedload(FDRRecord.status_history).joinedload(StatusHistory.actor),
    ).filter(FDRRecord.id == fdr_id).first()
    return _build_fdr_detail(record)


# ─────────────────────────────────────────────
# List FDR records
# ─────────────────────────────────────────────
@router.get("/", response_model=PaginatedFDRList)
def list_fdrs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[FDRStatus] = Query(None, alias="status"),
    institution_id: Optional[int] = Query(None),
    bank_name: Optional[str] = Query(None),
    maturity_from: Optional[str] = Query(None),
    maturity_to: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_dir: Optional[str] = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
    )

    # Scope: college users see only their institution
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles:
        q = q.filter(FDRRecord.institution_id == current_user.institution_id)
    else:
        # Admin filters
        if institution_id:
            q = q.filter(FDRRecord.institution_id == institution_id)

    if status_filter:
        q = q.filter(FDRRecord.status == status_filter)

    if search:
        q = q.filter(
            or_(
                FDRRecord.application_id.ilike(f"%{search}%"),
                FDRRecord.fdr_number.ilike(f"%{search}%"),
            )
        )

    if bank_name:
        q = q.filter(FDRRecord.bank_name.ilike(f"%{bank_name}%"))

    if maturity_from:
        q = q.filter(FDRRecord.maturity_date >= maturity_from)
    if maturity_to:
        q = q.filter(FDRRecord.maturity_date <= maturity_to)

    # Sorting
    sort_col = getattr(FDRRecord, sort_by, FDRRecord.created_at)
    if sort_dir == "asc":
        q = q.order_by(sort_col.asc())
    else:
        q = q.order_by(sort_col.desc())

    total = q.count()
    pages = max(1, math.ceil(total / page_size))
    items = q.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedFDRList(
        items=[_build_fdr_list_item(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


# ─────────────────────────────────────────────
# Get single FDR record
# ─────────────────────────────────────────────
@router.get("/{fdr_id}", response_model=FDRDetail)
def get_fdr(
    fdr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
        joinedload(FDRRecord.documents),
        joinedload(FDRRecord.status_history).joinedload(StatusHistory.actor),
    ).filter(FDRRecord.id == fdr_id).first()

    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")

    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_fdr_detail(record)


# ─────────────────────────────────────────────
# Admin: update status
# ─────────────────────────────────────────────
@router.post("/{fdr_id}/status", response_model=FDRDetail)
def update_status(
    fdr_id: int,
    payload: AdminStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")

    record = transition_status(db, record, payload.new_status, current_user, payload.remark)

    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.submitted_by_user),
        joinedload(FDRRecord.documents),
        joinedload(FDRRecord.status_history).joinedload(StatusHistory.actor),
    ).filter(FDRRecord.id == fdr_id).first()
    return _build_fdr_detail(record)


# ─────────────────────────────────────────────
# Upload document
# ─────────────────────────────────────────────
@router.post("/{fdr_id}/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    fdr_id: int,
    file: UploadFile = File(...),
    document_type: str = Form("fdr_document"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")

    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role in college_roles and record.status not in (FDRStatus.DRAFT, FDRStatus.RETURNED):
        raise HTTPException(status_code=422, detail="Documents can only be uploaded on draft or returned records")

    # Validate file using python-magic (PDF only, max 10 MB)
    raw = await file.read()
    validate_upload(raw, file.filename or "upload")
    await file.seek(0)

    storage_key, file_size = await storage_service.save(file, prefix=f"fdr/{fdr_id}")

    doc = Document(
        fdr_record_id=fdr_id,
        uploaded_by_id=current_user.id,
        original_filename=file.filename or "upload",
        storage_key=storage_key,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        document_type=document_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    add_audit_event(db, current_user.id, fdr_id, "document_uploaded", {"filename": file.filename, "document_id": doc.id})
    return DocumentOut.model_validate(doc)


# ─────────────────────────────────────────────
# Download / view document
# ─────────────────────────────────────────────
@router.get("/{fdr_id}/documents/{doc_id}/download")
def download_document(
    fdr_id: int,
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import FileResponse

    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc = db.query(Document).filter(Document.id == doc_id, Document.fdr_record_id == fdr_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        file_path = storage_service.get_path(doc.storage_key)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document reference")

    return FileResponse(
        path=file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
    )


# ─────────────────────────────────────────────
# Status history
# ─────────────────────────────────────────────
@router.get("/{fdr_id}/history", response_model=list[StatusHistoryOut])
def get_status_history(
    fdr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")

    history = db.query(StatusHistory).options(
        joinedload(StatusHistory.actor)
    ).filter(StatusHistory.fdr_record_id == fdr_id).order_by(StatusHistory.created_at).all()

    result = []
    for h in history:
        sh = StatusHistoryOut.model_validate(h)
        if h.actor:
            sh.actor_name = h.actor.full_name
        result.append(sh)
    return result
