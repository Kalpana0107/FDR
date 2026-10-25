"""
Sample Data Generator — Exactly 100 FDR records with deliberate duplicates,
renewal chains, checklist errors, and synthetic PDF attachments.

ALL DATA IS SYNTHETIC AND FOR DEMONSTRATION PURPOSES ONLY.
No real bank or AICTE confidential data is included.

Features included in this 100-record dataset:
1. DELIBERATE DUPLICATES:
   - Same FDR number across two different colleges (Cross-college duplicate: Critical alert).
   - Same FDR number with case/formatting variation across two colleges.
   - Identical document file (SHA-256 hash match) uploaded by two independent colleges.
   - Same FDR number submitted twice within the same college under different application IDs.
2. DELIBERATE RENEWAL CHAINS:
   - 3-step renewal chain: Root (2023) -> Ren1 (2024) -> Ren2 (2025, Active).
   - 2-step renewal chain: Root (2024) -> Ren1 (2025, Maturing).
   - Demonstrating that parent renewed records are superseded and count only ONCE in escrow totals!
3. REQUIRED-DOCUMENTS CHECKLIST ERRORS:
   - Complete document sets (fdr_certificate + joint_lien_letter + bank_covering_letter).
   - Missing joint-lien letter (flagged as non-compliant).
   - Missing bank covering letter.
   - Drafts with 0 documents uploaded.
4. DELIBERATE COMPLIANCE ANOMALIES:
   - Returned / Rejected records with audit logs.
   - Without AICTE lien clause (failed verification).
   - Soon-to-expire maturities.
"""
import sys
import os
import random
import hashlib
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, Institution, FDRRecord, FDRStatus,
    Document, StatusHistory, AuditEvent
)
from app.services.fdr_service import generate_application_id
from app.services.ocr_service import generate_sample_fdr_pdf

random.seed(2026)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

BANKS = [
    "State Bank of India",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
]

BRANCHES = [
    "Main Branch, Fort",
    "University Road Branch",
    "MG Road Branch",
    "Industrial Area Branch",
    "City Centre Branch",
    "Tech Park Branch",
]

PURPOSES = [
    "Security Deposit for AICTE Affiliation",
    "Security Deposit for New Engineering Course Approval",
    "Security Deposit for Polytechnic Accreditation",
    "Security Deposit for Campus Infrastructure Expansion",
    "Security Deposit for Research Centre Establishment",
]

INSTITUTIONS_SPEC = [
    ("Alpha Institute of Technology", "AIT-MH", "Mumbai", "Maharashtra"),
    ("Beta College of Engineering", "BCE-MH", "Pune", "Maharashtra"),
    ("Sahyadri Polytechnic", "SPA-MH", "Amravati", "Maharashtra"),
    ("Marathwada Engineering Institute", "MEI-MH", "Nanded", "Maharashtra"),
    ("Delhi National Institute of Technology", "DNIT-DL", "New Delhi", "Delhi"),
    ("Bangalore Institute of Advanced Technology", "BIAT-KA", "Bengaluru", "Karnataka"),
    ("Kolkata Technical University Campus", "KTUC-WB", "Kolkata", "West Bengal"),
    ("Chennai Institute of Polytechnic Studies", "CIPS-TN", "Chennai", "Tamil Nadu"),
]


def _create_sample_doc(db, record, uploader, doc_type, filename, raw_bytes):
    """Save document file to storage and record in database with SHA-256 hash."""
    file_hash = hashlib.sha256(raw_bytes).hexdigest()
    storage_sub = f"fdr/{record.id}"
    full_dir = os.path.join(UPLOAD_DIR, storage_sub)
    os.makedirs(full_dir, exist_ok=True)
    file_path = os.path.join(full_dir, filename)

    with open(file_path, "wb") as f:
        f.write(raw_bytes)

    doc = Document(
        fdr_record_id=record.id,
        uploaded_by_id=uploader.id,
        original_filename=filename,
        storage_key=f"{storage_sub}/{filename}",
        file_size=len(raw_bytes),
        mime_type="application/pdf",
        document_type=doc_type,
        file_hash=file_hash,
    )
    db.add(doc)
    db.flush()
    return doc


def seed_100_records(clean: bool = True):
    print("="*70)
    print("FDRGuard: Generating 100 Sample Records with Deliberate Duplicates & Errors")
    print("="*70)

    if clean:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ─────────────────────────────────────────────────────────────
        # 1. Institutions
        # ─────────────────────────────────────────────────────────────
        institutions = []
        for name, code, city, state in INSTITUTIONS_SPEC:
            inst = db.query(Institution).filter(Institution.code == code).first()
            if not inst:
                inst = Institution(name=name, code=code, city=city, state=state)
                db.add(inst)
                db.flush()
            institutions.append(inst)

        # ─────────────────────────────────────────────────────────────
        # 2. Demo Users
        # ─────────────────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == "admin@aicte.gov.in").first()
        if not admin:
            admin = User(
                email="admin@aicte.gov.in",
                full_name="AICTE Central Directorate Administrator [DEMO]",
                hashed_password=get_password_hash("Admin@1234"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.flush()

        officer = db.query(User).filter(User.email == "officer@aicte.gov.in").first()
        if not officer:
            officer = User(
                email="officer@aicte.gov.in",
                full_name="AICTE Verification Officer [DEMO]",
                hashed_password=get_password_hash("Officer@1234"),
                role=UserRole.OFFICER,
                is_active=True,
            )
            db.add(officer)
            db.flush()

        college_users = []
        for idx, inst in enumerate(institutions):
            email = f"college_{inst.code.lower()}@aicte-demo.in"
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    full_name=f"{inst.name} Registrar [DEMO]",
                    hashed_password=get_password_hash("College@1234"),
                    role=UserRole.COLLEGE_USER,
                    is_active=True,
                    institution_id=inst.id,
                )
                db.add(u)
                db.flush()
            college_users.append(u)

        created_records = []

        # ─────────────────────────────────────────────────────────────
        # 3. Deliberate Duplicate Set 1: Cross-College Exact FDR Number Collision
        # ─────────────────────────────────────────────────────────────
        # Inst 0 (Alpha) and Inst 2 (Sahyadri) submit identical FDR Number
        dup1_fdr = "FDR-2025-CROSS-DUP-9901"
        rec_dup1_a = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[0].id,
            submitted_by_id=college_users[0].id,
            fdr_number=dup1_fdr,
            bank_name="State Bank of India",
            branch_name="Main Branch, Fort",
            amount=Decimal("2000000"),
            currency="INR",
            issue_date=date(2025, 4, 1),
            maturity_date=date(2026, 4, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[DELIBERATE DUPLICATE: Same FDR number submitted by Alpha Institute]",
            status=FDRStatus.UNDER_REVIEW,
        )
        db.add(rec_dup1_a)
        db.flush()

        rec_dup1_b = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[2].id,
            submitted_by_id=college_users[2].id,
            fdr_number=dup1_fdr,  # IDENTICAL
            bank_name="State Bank of India",
            branch_name="Main Branch, Fort",
            amount=Decimal("2000000"),
            currency="INR",
            issue_date=date(2025, 4, 1),
            maturity_date=date(2026, 4, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[DELIBERATE DUPLICATE: Same FDR number submitted by Sahyadri Polytechnic]",
            status=FDRStatus.SUBMITTED,
        )
        db.add(rec_dup1_b)
        db.flush()
        created_records.extend([rec_dup1_a, rec_dup1_b])

        # Attach PDF to rec_dup1_a
        pdf_dup1 = generate_sample_fdr_pdf(
            fdr_number=dup1_fdr,
            bank_name="State Bank of India",
            amount=2000000.0,
            issue_date="2025-04-01",
            maturity_date="2026-04-01",
            college_name=institutions[0].name,
            has_lien=True,
        )
        _create_sample_doc(db, rec_dup1_a, college_users[0], "fdr_certificate", "FDR_Deposit_Certificate.pdf", pdf_dup1)

        # ─────────────────────────────────────────────────────────────
        # 4. Deliberate Duplicate Set 2: Cross-College Formatted / Case Variation
        # ─────────────────────────────────────────────────────────────
        rec_dup2_a = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[1].id,
            submitted_by_id=college_users[1].id,
            fdr_number="FDR-2025-DUP-CASE-8820",
            bank_name="Canara Bank",
            branch_name="University Road Branch",
            amount=Decimal("1500000"),
            currency="INR",
            issue_date=date(2025, 3, 1),
            maturity_date=date(2026, 3, 1),
            purpose="Security Deposit for New Engineering Course Approval",
            remarks="[DELIBERATE DUPLICATE: Upper case with hyphens]",
            status=FDRStatus.VERIFIED,
        )
        rec_dup2_b = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[3].id,
            submitted_by_id=college_users[3].id,
            fdr_number="fdr 2025 dup case 8820",  # Lowercase with spaces
            bank_name="Canara Bank",
            branch_name="University Road Branch",
            amount=Decimal("1500000"),
            currency="INR",
            issue_date=date(2025, 3, 1),
            maturity_date=date(2026, 3, 1),
            purpose="Security Deposit for New Engineering Course Approval",
            remarks="[DELIBERATE DUPLICATE: Formatted differently, normalized match]",
            status=FDRStatus.UNDER_REVIEW,
        )
        db.add_all([rec_dup2_a, rec_dup2_b])
        db.flush()
        created_records.extend([rec_dup2_a, rec_dup2_b])

        # ─────────────────────────────────────────────────────────────
        # 5. Deliberate Duplicate Set 3: Identical Document File (SHA-256 Match)
        # ─────────────────────────────────────────────────────────────
        # Shared PDF uploaded by Inst 4 (Delhi) and Inst 6 (Kolkata)
        rec_dup3_a = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[4].id,
            submitted_by_id=college_users[4].id,
            fdr_number="FDR-2025-DELHI-0041",
            bank_name="Punjab National Bank",
            branch_name="City Centre Branch",
            amount=Decimal("1200000"),
            currency="INR",
            issue_date=date(2025, 5, 1),
            maturity_date=date(2026, 5, 1),
            purpose="Campus Infrastructure Deposit",
            remarks="[DELIBERATE FILE DUPLICATE: Certificate file shared across institutes]",
            status=FDRStatus.SUBMITTED,
        )
        rec_dup3_b = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[6].id,
            submitted_by_id=college_users[6].id,
            fdr_number="FDR-2025-KOLKATA-0072",
            bank_name="Punjab National Bank",
            branch_name="City Centre Branch",
            amount=Decimal("1200000"),
            currency="INR",
            issue_date=date(2025, 5, 1),
            maturity_date=date(2026, 5, 1),
            purpose="Campus Infrastructure Deposit",
            remarks="[DELIBERATE FILE DUPLICATE: Identical PDF file bytes uploaded]",
            status=FDRStatus.UNDER_REVIEW,
        )
        db.add_all([rec_dup3_a, rec_dup3_b])
        db.flush()
        created_records.extend([rec_dup3_a, rec_dup3_b])

        shared_pdf = generate_sample_fdr_pdf(
            fdr_number="FDR-2025-SHARED-DOC-77",
            bank_name="Punjab National Bank",
            amount=1200000.0,
            issue_date="2025-05-01",
            maturity_date="2026-05-01",
            college_name="Technical Education Society",
            has_lien=True,
        )
        # Attach identical bytes to both
        _create_sample_doc(db, rec_dup3_a, college_users[4], "fdr_certificate", "Deposit_Receipt_Shared.pdf", shared_pdf)
        _create_sample_doc(db, rec_dup3_b, college_users[6], "fdr_certificate", "Deposit_Receipt_Uploaded.pdf", shared_pdf)

        # ─────────────────────────────────────────────────────────────
        # 6. Deliberate Duplicate Set 4: Same College Accidental Re-submission
        # ─────────────────────────────────────────────────────────────
        dup4_fdr = "FDR-2025-BIAT-ACCIDENTAL-01"
        rec_dup4_a = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[5].id,
            submitted_by_id=college_users[5].id,
            fdr_number=dup4_fdr,
            bank_name="HDFC Bank",
            branch_name="Tech Park Branch",
            amount=Decimal("1800000"),
            currency="INR",
            issue_date=date(2025, 2, 1),
            maturity_date=date(2026, 2, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[DELIBERATE DUPLICATE: Initial submission]",
            status=FDRStatus.RETURNED,
            admin_remark="Clarification needed on signatory seal.",
        )
        rec_dup4_b = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[5].id,
            submitted_by_id=college_users[5].id,
            fdr_number=dup4_fdr,
            bank_name="HDFC Bank",
            branch_name="Tech Park Branch",
            amount=Decimal("1800000"),
            currency="INR",
            issue_date=date(2025, 2, 1),
            maturity_date=date(2026, 2, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[DELIBERATE DUPLICATE: Duplicate re-submission under new application ID]",
            status=FDRStatus.SUBMITTED,
        )
        db.add_all([rec_dup4_a, rec_dup4_b])
        db.flush()
        created_records.extend([rec_dup4_a, rec_dup4_b])

        # ─────────────────────────────────────────────────────────────
        # 7. Deliberate Renewal Chain 1: 3-Step Renewal Lineage
        # ─────────────────────────────────────────────────────────────
        # Root (2023) -> Ren1 (2024) -> Ren2 (2025, Active)
        # Demonstrates: Renewal links to old FDR and counts once!
        c1_inst = institutions[0]
        c1_user = college_users[0]

        # Step 1: Root
        r1_root = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=c1_inst.id,
            submitted_by_id=c1_user.id,
            fdr_number="DEMO-FDR-CHAIN1-ROOT",
            bank_name="Bank of Baroda",
            branch_name="MG Road Branch",
            amount=Decimal("2500000"),
            currency="INR",
            issue_date=date(2023, 6, 1),
            maturity_date=date(2024, 6, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[RENEWAL CHAIN 1: Original Root Instrument]",
            status=FDRStatus.RENEWED,
            admin_remark="Renewed via application chain.",
        )
        db.add(r1_root)
        db.flush()

        # Step 2: Renewal 1 (supersedes root)
        r1_ren1 = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=c1_inst.id,
            submitted_by_id=c1_user.id,
            fdr_number="DEMO-FDR-CHAIN1-REN1",
            bank_name="Bank of Baroda",
            branch_name="MG Road Branch",
            amount=Decimal("2500000"),
            currency="INR",
            issue_date=date(2024, 6, 1),
            maturity_date=date(2025, 6, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[RENEWAL CHAIN 1: First Renewal]",
            status=FDRStatus.RENEWED,
            parent_fdr_id=r1_root.id,
            admin_remark="Renewed for another tenure term.",
        )
        db.add(r1_ren1)
        db.flush()

        # Step 3: Renewal 2 (Active Leaf)
        r1_ren2 = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=c1_inst.id,
            submitted_by_id=c1_user.id,
            fdr_number="DEMO-FDR-CHAIN1-REN2",
            bank_name="Bank of Baroda",
            branch_name="MG Road Branch",
            amount=Decimal("2500000"),
            currency="INR",
            issue_date=date(2025, 6, 1),
            maturity_date=date(2027, 6, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[RENEWAL CHAIN 1: Current Active Renewal Leaf — Counts Once]",
            status=FDRStatus.ACTIVE,
            parent_fdr_id=r1_ren1.id,
        )
        db.add(r1_ren2)
        db.flush()
        created_records.extend([r1_root, r1_ren1, r1_ren2])

        # Attach complete checklist documents to active leaf
        pdf_ren2 = generate_sample_fdr_pdf(
            fdr_number="DEMO-FDR-CHAIN1-REN2",
            bank_name="Bank of Baroda",
            amount=2500000.0,
            issue_date="2025-06-01",
            maturity_date="2027-06-01",
            college_name=c1_inst.name,
            has_lien=True,
        )
        _create_sample_doc(db, r1_ren2, c1_user, "fdr_certificate", "FDR_Certificate_Renewal2.pdf", pdf_ren2)
        _create_sample_doc(db, r1_ren2, c1_user, "joint_lien_letter", "Joint_Lien_Confirmation.pdf", pdf_ren2)
        _create_sample_doc(db, r1_ren2, c1_user, "bank_covering_letter", "Bank_Attestation_Letter.pdf", pdf_ren2)

        # ─────────────────────────────────────────────────────────────
        # 8. Deliberate Renewal Chain 2: 2-Step Renewal Lineage
        # ─────────────────────────────────────────────────────────────
        c2_inst = institutions[1]
        c2_user = college_users[1]

        r2_root = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=c2_inst.id,
            submitted_by_id=c2_user.id,
            fdr_number="DEMO-FDR-CHAIN2-ROOT",
            bank_name="ICICI Bank",
            branch_name="Industrial Area Branch",
            amount=Decimal("1000000"),
            currency="INR",
            issue_date=date(2024, 1, 1),
            maturity_date=date(2025, 1, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[RENEWAL CHAIN 2: Original Deposit]",
            status=FDRStatus.RENEWED,
        )
        db.add(r2_root)
        db.flush()

        r2_ren = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=c2_inst.id,
            submitted_by_id=c2_user.id,
            fdr_number="DEMO-FDR-CHAIN2-REN",
            bank_name="ICICI Bank",
            branch_name="Industrial Area Branch",
            amount=Decimal("1000000"),
            currency="INR",
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 12, 31),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[RENEWAL CHAIN 2: Active Renewal]",
            status=FDRStatus.MATURING,
            parent_fdr_id=r2_root.id,
        )
        db.add(r2_ren)
        db.flush()
        created_records.extend([r2_root, r2_ren])

        # ─────────────────────────────────────────────────────────────
        # 9. Deliberate Checklist Error Records
        # ─────────────────────────────────────────────────────────────
        # Record with missing Joint Lien Letter
        rec_err_lien = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[7].id,
            submitted_by_id=college_users[7].id,
            fdr_number="DEMO-FDR-ERR-MISSING-LIEN",
            bank_name="Indian Bank",
            branch_name="City Centre Branch",
            amount=Decimal("1500000"),
            currency="INR",
            issue_date=date(2025, 6, 1),
            maturity_date=date(2026, 6, 1),
            purpose="Security Deposit for AICTE Affiliation",
            remarks="[CHECKLIST ERROR: Missing mandatory Joint Lien Endorsement Letter]",
            status=FDRStatus.SUBMITTED,
        )
        db.add(rec_err_lien)
        db.flush()
        created_records.append(rec_err_lien)

        pdf_no_lien = generate_sample_fdr_pdf(
            fdr_number="DEMO-FDR-ERR-MISSING-LIEN",
            bank_name="Indian Bank",
            amount=1500000.0,
            issue_date="2025-06-01",
            maturity_date="2026-06-01",
            college_name=institutions[7].name,
            has_lien=False,  # NO LIEN
        )
        # Only fdr_certificate uploaded, missing joint_lien_letter & bank_covering_letter
        _create_sample_doc(db, rec_err_lien, college_users[7], "fdr_certificate", "FDR_Certificate.pdf", pdf_no_lien)

        # Record with missing Bank Covering Letter
        rec_err_cov = FDRRecord(
            application_id=generate_application_id(db),
            institution_id=institutions[3].id,
            submitted_by_id=college_users[3].id,
            fdr_number="DEMO-FDR-ERR-MISSING-COVERING",
            bank_name="Union Bank of India",
            branch_name="MG Road Branch",
            amount=Decimal("800000"),
            currency="INR",
            issue_date=date(2025, 7, 1),
            maturity_date=date(2026, 7, 1),
            purpose="Accreditation Deposit",
            remarks="[CHECKLIST ERROR: Missing mandatory Bank Confirmation Covering Letter]",
            status=FDRStatus.RETURNED,
            admin_remark="Returned due to missing official bank covering letter on branch letterhead.",
        )
        db.add(rec_err_cov)
        db.flush()
        created_records.append(rec_err_cov)

        pdf_cov = generate_sample_fdr_pdf(
            fdr_number="DEMO-FDR-ERR-MISSING-COVERING",
            bank_name="Union Bank of India",
            amount=800000.0,
            issue_date="2025-07-01",
            maturity_date="2026-07-01",
            college_name=institutions[3].name,
            has_lien=True,
        )
        _create_sample_doc(db, rec_err_cov, college_users[3], "fdr_certificate", "FDR_Certificate.pdf", pdf_cov)
        _create_sample_doc(db, rec_err_cov, college_users[3], "joint_lien_letter", "Joint_Lien_Under_Taking.pdf", pdf_cov)
        # bank_covering_letter is omitted!

        # ─────────────────────────────────────────────────────────────
        # 10. Fill up remaining records to reach exactly 100
        # ─────────────────────────────────────────────────────────────
        already_count = len(created_records)
        target_count = 100
        remaining_needed = target_count - already_count

        status_pool = (
            [FDRStatus.ACTIVE] * 32 +
            [FDRStatus.VERIFIED] * 14 +
            [FDRStatus.UNDER_REVIEW] * 12 +
            [FDRStatus.SUBMITTED] * 10 +
            [FDRStatus.MATURING] * 7 +
            [FDRStatus.RETURNED] * 3 +
            [FDRStatus.REJECTED] * 3 +
            [FDRStatus.DRAFT] * 2
        )
        random.shuffle(status_pool)

        amounts_pool = [500000, 750000, 1000000, 1500000, 2000000, 2500000, 3000000, 5000000]

        for i in range(remaining_needed):
            inst = institutions[i % len(institutions)]
            user = college_users[i % len(college_users)]
            st = status_pool[i] if i < len(status_pool) else FDRStatus.ACTIVE
            amt = random.choice(amounts_pool)
            bank = random.choice(BANKS)
            branch = random.choice(BRANCHES)

            # Dates
            issue_days_ago = random.randint(30, 720)
            issue_dt = date.today() - timedelta(days=issue_days_ago)
            tenure_days = random.choice([365, 730, 1095])
            maturity_dt = issue_dt + timedelta(days=tenure_days)

            # If maturing, adjust maturity date to near future (within 30 days)
            if st == FDRStatus.MATURING:
                maturity_dt = date.today() + timedelta(days=random.randint(5, 30))

            fdr_num = f"FDR-2025-{inst.code}-{i+100:04d}"
            app_id = generate_application_id(db)

            admin_rmk = None
            if st == FDRStatus.RETURNED:
                admin_rmk = "Please provide updated joint lien undertaking letter."
            elif st == FDRStatus.REJECTED:
                admin_rmk = "Bank verification failed: account not found in Core Banking Network."

            rec = FDRRecord(
                application_id=app_id,
                institution_id=inst.id,
                submitted_by_id=user.id,
                fdr_number=fdr_num,
                bank_name=bank,
                branch_name=branch,
                amount=Decimal(str(amt)),
                currency="INR",
                issue_date=issue_dt,
                maturity_date=maturity_dt,
                purpose=random.choice(PURPOSES),
                remarks="[SYNTHETIC DATA - AICTE DEMONSTRATION RECORD]",
                status=st,
                admin_remark=admin_rmk,
                submitted_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)) if st != FDRStatus.DRAFT else None,
            )
            db.add(rec)
            db.flush()
            created_records.append(rec)

            # Generate synthetic documents based on status
            if st != FDRStatus.DRAFT:
                pdf_data = generate_sample_fdr_pdf(
                    fdr_number=fdr_num,
                    bank_name=bank,
                    amount=float(amt),
                    issue_date=issue_dt.isoformat(),
                    maturity_date=maturity_dt.isoformat(),
                    branch_name=branch,
                    college_name=inst.name,
                    has_lien=True,
                )
                _create_sample_doc(db, rec, user, "fdr_certificate", f"{fdr_num}_Certificate.pdf", pdf_data)

                # For active/verified records, attach complete checklist
                if st in (FDRStatus.ACTIVE, FDRStatus.VERIFIED):
                    _create_sample_doc(db, rec, user, "joint_lien_letter", f"{fdr_num}_JointLien.pdf", pdf_data)
                    _create_sample_doc(db, rec, user, "bank_covering_letter", f"{fdr_num}_CoveringLetter.pdf", pdf_data)

            # Add status history
            hist = StatusHistory(
                fdr_record_id=rec.id,
                actor_id=user.id if st == FDRStatus.DRAFT else admin.id,
                from_status=None if st == FDRStatus.DRAFT else FDRStatus.DRAFT,
                to_status=st,
                remark=admin_rmk or f"Status set to {st.value}",
            )
            db.add(hist)

        db.commit()

        # ─────────────────────────────────────────────────────────────
        # Verification Summary
        # ─────────────────────────────────────────────────────────────
        total_in_db = db.query(FDRRecord).count()
        print(f"\n[OK] Successfully populated database with exactly {total_in_db} FDR records.")
        print(f"[OK] Total technical institutions represented: {len(institutions)}")

        # Run duplicate check
        from app.services.duplicate_service import detect_all_duplicates
        dups = detect_all_duplicates(db)
        print(f"\n[Task 1] Duplicate Detection Engine:")
        print(f"  - Total duplicate collision alerts identified: {len(dups)}")
        for d in dups[:4]:
            print(f"    * [{d['severity']}] {d['duplicate_type']}: {d['flagged_fdr_number']}")
            print(f"      Institutes: {d['institution_a']['name']} vs {d['institution_b']['name']}")

        # Run checklist check
        from app.services.checklist_service import evaluate_fdr_checklist
        complete_count = 0
        incomplete_count = 0
        all_recs = db.query(FDRRecord).all()
        for r in all_recs:
            chk = evaluate_fdr_checklist(r)
            if chk["is_complete"]:
                complete_count += 1
            else:
                incomplete_count += 1
        print(f"\n[Task 2] Required-Documents Checklist Engine:")
        print(f"  - Complete document sets: {complete_count}")
        print(f"  - Flagged incomplete / missing documents: {incomplete_count}")

        # Run renewal metrics
        from app.services.renewal_service import calculate_active_metrics
        m = calculate_active_metrics(db)
        print(f"\n[Task 3] Renewal Chain Engine (Renewals Count Once):")
        print(f"  - Total records: {m['total_records']}")
        print(f"  - Distinct root deposit lineages: {m['unique_lineages_count']}")
        print(f"  - Active non-superseded escrows: {m['active_records_count']}")
        print(f"  - Active escrow amount (renewals counted once): INR {m['active_escrow_amount']:,.2f}")
        print(f"  - Superseded renewed parent instruments excluded: {m['renewed_records_superseded_count']} (INR {m['renewed_amount_excluded']:,.2f})")

        # Run OCR validation
        from app.services.ocr_service import extract_fdr_from_pdf
        sample_doc = db.query(Document).filter(Document.mime_type == "application/pdf").first()
        if sample_doc:
            with open(os.path.join(UPLOAD_DIR, sample_doc.storage_key), "rb") as f:
                ocr_check = extract_fdr_from_pdf(f.read())
            print(f"\n[Task 4] OCR Engine Live Validation:")
            print(f"  - Scanned file: {sample_doc.original_filename}")
            print(f"  - Extracted FDR #: {ocr_check['fdr_number']}")
            print(f"  - Extracted Bank: {ocr_check['bank_name']}")
            print(f"  - Extracted Amount: INR {ocr_check['amount']:,.2f}" if ocr_check['amount'] else "  - Amount: N/A")
            print(f"  - Extracted Dates: Issue={ocr_check['issue_date']}, Maturity={ocr_check['maturity_date']}")
            print(f"  - AICTE Joint Lien Detected: {ocr_check['joint_lien_detected']}")
            print(f"  - Confidence: {ocr_check['confidence'] * 100:.0f}%")

        print("\n" + "="*70)
        print("100-RECORD DATASET SEEDED SUCCESSFULLY")
        print("="*70 + "\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding 100 records: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_100_records()
