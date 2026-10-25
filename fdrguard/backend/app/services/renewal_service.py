"""
Renewal chain service for FDRGuard.

Rules:
1. A renewal links to the old FDR via `parent_fdr_id`.
2. The old FDR status transitions to `FDRStatus.RENEWED`.
3. In financial totals and dashboard escrows, renewals "count once":
   - Superseded FDRs (status == RENEWED or having active child renewals) are excluded from active counts and escrow totals.
   - Each deposit lineage counts exactly once for current active exposure.
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from ..models.fdr import FDRRecord, FDRStatus
from ..models.user import User
from .fdr_service import transition_status, add_audit_event, generate_application_id


def create_fdr_renewal(
    db: Session,
    old_fdr_id: int,
    renewal_payload: Dict[str, Any],
    actor: User,
) -> FDRRecord:
    """
    Create a new FDR record linked as a renewal of `old_fdr_id`.
    Transitions old FDR to RENEWED, sets parent_fdr_id on new record.
    """
    old_fdr = db.query(FDRRecord).filter(FDRRecord.id == old_fdr_id).first()
    if not old_fdr:
        raise ValueError("Original FDR record not found")

    if old_fdr.status == FDRStatus.RENEWED:
        raise ValueError("Cannot renew an FDR that has already been renewed. Renew the latest active record in the chain.")

    app_id = generate_application_id(db)
    new_fdr = FDRRecord(
        application_id=app_id,
        institution_id=old_fdr.institution_id,
        submitted_by_id=actor.id,
        fdr_number=renewal_payload.get("fdr_number", f"{old_fdr.fdr_number}-REN"),
        bank_name=renewal_payload.get("bank_name", old_fdr.bank_name),
        branch_name=renewal_payload.get("branch_name", old_fdr.branch_name),
        amount=renewal_payload.get("amount", old_fdr.amount),
        currency=renewal_payload.get("currency", old_fdr.currency),
        issue_date=renewal_payload.get("issue_date", old_fdr.maturity_date),
        maturity_date=renewal_payload.get("maturity_date"),
        purpose=renewal_payload.get("purpose", old_fdr.purpose),
        remarks=renewal_payload.get("remarks", f"Renewal of application {old_fdr.application_id}"),
        status=FDRStatus.SUBMITTED,
        parent_fdr_id=old_fdr.id,
    )
    db.add(new_fdr)
    db.flush()

    # Transition old FDR to RENEWED status
    old_fdr.status = FDRStatus.RENEWED
    old_fdr.admin_remark = f"Renewed by application {new_fdr.application_id} (FDR #{new_fdr.fdr_number})"

    add_audit_event(
        db,
        actor.id,
        old_fdr.id,
        "fdr_renewed",
        {"renewal_fdr_id": new_fdr.id, "new_application_id": new_fdr.application_id},
    )
    add_audit_event(
        db,
        actor.id,
        new_fdr.id,
        "fdr_renewal_created",
        {"parent_fdr_id": old_fdr.id, "parent_application_id": old_fdr.application_id},
    )

    db.commit()
    db.refresh(new_fdr)
    return new_fdr


def get_renewal_chain(db: Session, fdr_id: int) -> Dict[str, Any]:
    """
    Get the complete renewal chain for an FDR.
    Traverses up to find the root ancestor, then gathers all successive renewals in order.
    """
    current = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution)
    ).filter(FDRRecord.id == fdr_id).first()

    if not current:
        return {"root_id": None, "chain": [], "total_steps": 0}

    # Step 1: Traverse up to the root parent
    root = current
    visited_up = {root.id}
    while root.parent_fdr_id is not None:
        parent = db.query(FDRRecord).options(
            joinedload(FDRRecord.institution)
        ).filter(FDRRecord.id == root.parent_fdr_id).first()
        if not parent or parent.id in visited_up:
            break
        visited_up.add(parent.id)
        root = parent

    # Step 2: Traverse down from root to collect all descendants
    chain_nodes = []
    queue = [root]
    visited_down = set()

    while queue:
        node = queue.pop(0)
        if node.id in visited_down:
            continue
        visited_down.add(node.id)

        # Find direct children
        children = db.query(FDRRecord).filter(FDRRecord.parent_fdr_id == node.id).order_by(FDRRecord.created_at.asc()).all()

        is_current_target = (node.id == fdr_id)
        is_leaf = len(children) == 0

        chain_nodes.append({
            "id": node.id,
            "application_id": node.application_id,
            "fdr_number": node.fdr_number,
            "bank_name": node.bank_name,
            "amount": float(node.amount),
            "issue_date": node.issue_date.isoformat() if node.issue_date else None,
            "maturity_date": node.maturity_date.isoformat() if node.maturity_date else None,
            "status": node.status.value,
            "parent_fdr_id": node.parent_fdr_id,
            "is_target": is_current_target,
            "is_leaf": is_leaf,
            "is_active_instrument": node.status in (FDRStatus.ACTIVE, FDRStatus.VERIFIED, FDRStatus.MATURING),
        })

        queue.extend(children)

    return {
        "root_id": root.id,
        "root_fdr_number": root.fdr_number,
        "institution_name": root.institution.name if root.institution else None,
        "total_nodes_in_chain": len(chain_nodes),
        "chain": chain_nodes,
        "rule_note": "A renewal links to the old FDR and counts once in active compliance calculations.",
    }


def calculate_active_metrics(db: Session, institution_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Calculate totals ensuring renewals 'count once':
    - Superseded parent records (status == RENEWED) are excluded from active counts and financial totals.
    - Only active leaf deposits count towards current active deposit exposure.
    """
    q = db.query(FDRRecord)
    if institution_id:
        q = q.filter(FDRRecord.institution_id == institution_id)

    all_records = q.all()
    total_records = len(all_records)

    # Active instruments (Active, Verified, Maturing)
    active_statuses = {FDRStatus.ACTIVE, FDRStatus.VERIFIED, FDRStatus.MATURING}

    # Identify renewed records
    renewed_records = [r for r in all_records if r.status == FDRStatus.RENEWED]
    active_records = [r for r in all_records if r.status in active_statuses]

    # Calculate total amount of all active non-renewed records
    active_escrow_amount = sum(float(r.amount) for r in active_records)
    renewed_superseded_amount = sum(float(r.amount) for r in renewed_records)
    gross_all_amount = sum(float(r.amount) for r in all_records)

    # Count distinct root lineages
    # A root is any record where parent_fdr_id is None
    roots = [r for r in all_records if r.parent_fdr_id is None]

    return {
        "total_records": total_records,
        "unique_lineages_count": len(roots),
        "active_records_count": len(active_records),
        "active_escrow_amount": active_escrow_amount,
        "renewed_records_superseded_count": len(renewed_records),
        "renewed_amount_excluded": renewed_superseded_amount,
        "gross_cumulative_amount": gross_all_amount,
        "renewals_counted_once": True,
    }
