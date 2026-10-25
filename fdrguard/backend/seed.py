"""
Seed script — generates synthetic demonstration data.

ALL DATA IS SYNTHETIC AND FOR DEMONSTRATION PURPOSES ONLY.
No real bank or AICTE data is included.

Demo credentials:
  Admin (OFFICER):  admin@aicte.gov.in          / Admin@1234
  College A:        college_a@techA.edu.in       / College@1234
  College B:        college_b@techB.edu.in       / College@1234
  Bank Verifier:    bank_verifier@verify.in      / Verifier@1234
  Approver:         approver@aicte.gov.in        / Approver@1234
  Management:       management@aicte.gov.in      / Mgmt@1234
"""
import sys
import os
import random
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, Institution, FDRRecord, FDRStatus,
    Document, StatusHistory, AuditEvent
)
from app.services.fdr_service import generate_application_id, add_audit_event

# Seed reproducibility
random.seed(42)

BANKS = [
    "State Bank of India", "Punjab National Bank", "Bank of Baroda",
    "Canara Bank", "HDFC Bank", "ICICI Bank", "Union Bank of India",
    "Indian Bank", "Bank of India", "Axis Bank",
]
BRANCHES = [
    "Main Branch", "City Centre Branch", "MG Road Branch",
    "University Road Branch", "Industrial Area Branch",
]
PURPOSES = [
    "Security Deposit for Affiliation",
    "Security Deposit for Course Approval",
    "Security Deposit for NBA Accreditation",
    "Security Deposit for NIRF Ranking",
    "Security Deposit for New Campus",
    "Security Deposit for Hostel Facility",
]


def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ──────────────────────────────────
        # Institutions
        # ──────────────────────────────────
        inst_a = Institution(
            name="DEMO - Alpha Institute of Technology [SYNTHETIC]",
            code="AIT-DEMO",
            address="123 Innovation Road",
            city="Mumbai",
            state="Maharashtra",
        )
        inst_b = Institution(
            name="DEMO - Beta College of Engineering [SYNTHETIC]",
            code="BCE-DEMO",
            address="456 Knowledge Park",
            city="Pune",
            state="Maharashtra",
        )
        db.add_all([inst_a, inst_b])
        db.flush()

        # ──────────────────────────────────
        # Users — one demo user per role
        # ──────────────────────────────────
        # ADMIN (maps to OFFICER in new scheme — kept for backward compat)
        admin = User(
            email="admin@aicte.gov.in",
            full_name="AICTE Administrator [DEMO]",
            hashed_password=get_password_hash("Admin@1234"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        # COLLEGE / COLLEGE_USER
        user_a = User(
            email="college_a@techA.edu.in",
            full_name="College A Officer [DEMO]",
            hashed_password=get_password_hash("College@1234"),
            role=UserRole.COLLEGE_USER,
            is_active=True,
            institution_id=inst_a.id,
        )
        user_b = User(
            email="college_b@techB.edu.in",
            full_name="College B Officer [DEMO]",
            hashed_password=get_password_hash("College@1234"),
            role=UserRole.COLLEGE_USER,
            is_active=True,
            institution_id=inst_b.id,
        )
        # OFFICER
        officer = User(
            email="officer@aicte.gov.in",
            full_name="AICTE Officer [DEMO]",
            hashed_password=get_password_hash("Officer@1234"),
            role=UserRole.OFFICER,
            is_active=True,
        )
        # BANK_VERIFIER
        bank_verifier = User(
            email="bank_verifier@verify.in",
            full_name="Bank Verification Officer [DEMO]",
            hashed_password=get_password_hash("Verifier@1234"),
            role=UserRole.BANK_VERIFIER,
            is_active=True,
        )
        # APPROVER
        approver = User(
            email="approver@aicte.gov.in",
            full_name="FDR Approver [DEMO]",
            hashed_password=get_password_hash("Approver@1234"),
            role=UserRole.APPROVER,
            is_active=True,
        )
        # MANAGEMENT
        management = User(
            email="management@aicte.gov.in",
            full_name="AICTE Management [DEMO]",
            hashed_password=get_password_hash("Mgmt@1234"),
            role=UserRole.MANAGEMENT,
            is_active=True,
        )
        # COLLEGE role (new explicit college role)
        college_user = User(
            email="college@techC.edu.in",
            full_name="College C Representative [DEMO]",
            hashed_password=get_password_hash("College@1234"),
            role=UserRole.COLLEGE,
            is_active=True,
            institution_id=inst_a.id,
        )

        db.add_all([admin, user_a, user_b, officer, bank_verifier, approver, management, college_user])
        db.flush()

        # ──────────────────────────────────
        # FDR records — various statuses
        # ──────────────────────────────────
        statuses_sequence = [
            FDRStatus.DRAFT,
            FDRStatus.SUBMITTED,
            FDRStatus.SUBMITTED,
            FDRStatus.UNDER_REVIEW,
            FDRStatus.UNDER_REVIEW,
            FDRStatus.VERIFIED,
            FDRStatus.VERIFIED,
            FDRStatus.VERIFIED,
            FDRStatus.RETURNED,
            FDRStatus.RETURNED,
            FDRStatus.REJECTED,
            FDRStatus.SUBMITTED,
            FDRStatus.DRAFT,
            FDRStatus.VERIFIED,
        ]

        all_records = []

        for institution, user, label in [
            (inst_a, user_a, "AIT"),
            (inst_b, user_b, "BCE"),
        ]:
            for i, target_status in enumerate(statuses_sequence):
                amount = random.choice([100000, 200000, 500000, 750000, 1000000])
                issue_dt = date.today() - timedelta(days=random.randint(30, 365))
                maturity_dt = issue_dt + timedelta(days=random.choice([365, 730, 1095]))

                app_id = generate_application_id(db)

                record = FDRRecord(
                    application_id=app_id,
                    institution_id=institution.id,
                    submitted_by_id=user.id,
                    fdr_number=f"DEMO-FDR-{label}-{i+1:04d}",
                    bank_name=random.choice(BANKS),
                    branch_name=random.choice(BRANCHES),
                    amount=amount,
                    currency="INR",
                    issue_date=issue_dt,
                    maturity_date=maturity_dt,
                    purpose=random.choice(PURPOSES),
                    remarks="[SYNTHETIC DATA - NOT A REAL BANK INSTRUMENT]",
                    status=FDRStatus.DRAFT,
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
                )
                db.add(record)
                db.flush()

                # Build up status history to reach target
                steps = _get_status_path(target_status)
                prev = None
                for step_status in steps:
                    actor = admin if step_status in (
                        FDRStatus.UNDER_REVIEW, FDRStatus.VERIFIED,
                        FDRStatus.RETURNED, FDRStatus.REJECTED,
                    ) else user
                    remark = None
                    if step_status == FDRStatus.RETURNED:
                        remark = f"[DEMO] Please provide updated FDR details for record {app_id}."
                    elif step_status == FDRStatus.REJECTED:
                        remark = f"[DEMO] FDR could not be verified. Insufficient documentation."

                    history = StatusHistory(
                        fdr_record_id=record.id,
                        actor_id=actor.id,
                        from_status=prev,
                        to_status=step_status,
                        remark=remark,
                    )
                    db.add(history)
                    prev = step_status

                record.status = target_status
                if target_status != FDRStatus.DRAFT:
                    record.submitted_at = record.created_at + timedelta(days=1)
                if target_status in (FDRStatus.RETURNED, FDRStatus.REJECTED):
                    record.admin_remark = f"[DEMO] Review remark for {app_id}."

                all_records.append(record)

        db.commit()
        print(f"✓ Created {len(all_records)} synthetic FDR records.")
        print("\n" + "="*60)
        print("DEMO LOGIN CREDENTIALS")
        print("="*60)
        print("  Admin (OFFICER):  admin@aicte.gov.in          | Admin@1234")
        print("  College A:        college_a@techA.edu.in       | College@1234")
        print("  College B:        college_b@techB.edu.in       | College@1234")
        print("  Officer:          officer@aicte.gov.in         | Officer@1234")
        print("  Bank Verifier:    bank_verifier@verify.in      | Verifier@1234")
        print("  Approver:         approver@aicte.gov.in        | Approver@1234")
        print("  Management:       management@aicte.gov.in      | Mgmt@1234")
        print("  College (new):    college@techC.edu.in         | College@1234")
        print("="*60)
        print("\n⚠️  ALL DATA IS SYNTHETIC — NOT FOR REAL USE\n")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


def _get_status_path(target: FDRStatus):
    """Return the list of statuses to transition through to reach target."""
    if target == FDRStatus.DRAFT:
        return [FDRStatus.DRAFT]
    elif target == FDRStatus.SUBMITTED:
        return [FDRStatus.DRAFT, FDRStatus.SUBMITTED]
    elif target == FDRStatus.UNDER_REVIEW:
        return [FDRStatus.DRAFT, FDRStatus.SUBMITTED, FDRStatus.UNDER_REVIEW]
    elif target == FDRStatus.VERIFIED:
        return [FDRStatus.DRAFT, FDRStatus.SUBMITTED, FDRStatus.UNDER_REVIEW, FDRStatus.VERIFIED]
    elif target == FDRStatus.RETURNED:
        return [FDRStatus.DRAFT, FDRStatus.SUBMITTED, FDRStatus.UNDER_REVIEW, FDRStatus.RETURNED]
    elif target == FDRStatus.REJECTED:
        return [FDRStatus.DRAFT, FDRStatus.SUBMITTED, FDRStatus.UNDER_REVIEW, FDRStatus.REJECTED]
    return [FDRStatus.DRAFT]


if __name__ == "__main__":
    if "--legacy" in sys.argv:
        seed()
    else:
        from seed_100_records import seed_100_records
        seed_100_records()
