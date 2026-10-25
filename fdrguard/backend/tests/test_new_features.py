"""
Unit tests for:
1. Duplicate detection (same FDR number, same file, same FDR used by two colleges).
2. Required-documents checklist (flagging missing documents).
3. Renewal chain (linking to old FDR and counting once).
4. OCR (reading FDR number, bank, amount, and dates from PDF).
"""
import io
import pytest
from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Institution, FDRRecord, FDRStatus, Document
from app.services.duplicate_service import detect_all_duplicates, check_fdr_duplicates
from app.services.checklist_service import evaluate_fdr_checklist
from app.services.renewal_service import create_fdr_renewal, get_renewal_chain, calculate_active_metrics
from app.services.ocr_service import extract_fdr_from_pdf, generate_sample_fdr_pdf

TEST_DATABASE_URL = "sqlite:///./test_features_fdrguard.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_inst(db, name="College Alpha", code="COL-A"):
    inst = Institution(name=name, code=code, city="Mumbai", state="Maharashtra")
    db.add(inst)
    db.flush()
    return inst


def make_user(db, email, role=UserRole.COLLEGE_USER, institution_id=None):
    user = User(
        email=email,
        full_name="Officer Demo",
        hashed_password=get_password_hash("Test@1234"),
        role=role,
        is_active=True,
        institution_id=institution_id,
    )
    db.add(user)
    db.flush()
    return user


def get_token(client, email):
    r = client.post("/api/auth/login", json={"email": email, "password": "Test@1234"})
    assert r.status_code == 200
    return r.json()["access_token"]


# ─────────────────────────────────────────────────────────────────────────────
# Task 1: Duplicate Detection Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestDuplicateDetection:
    def test_same_fdr_number_cross_college(self, db):
        inst_a = make_inst(db, "Alpha College of Engineering", "ACE")
        inst_b = make_inst(db, "Beta Polytechnic", "BPT")
        user_a = make_user(db, "a@ace.edu", institution_id=inst_a.id)
        user_b = make_user(db, "b@bpt.edu", institution_id=inst_b.id)

        # Record A at College Alpha
        rec_a = FDRRecord(
            application_id="APP-2025-0001",
            institution_id=inst_a.id,
            submitted_by_id=user_a.id,
            fdr_number="FDR-COLLISION-9999",
            bank_name="State Bank of India",
            amount=Decimal("1500000"),
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 1, 1),
            purpose="Affiliation Deposit",
            status=FDRStatus.SUBMITTED,
        )
        # Record B at College Beta with same FDR number
        rec_b = FDRRecord(
            application_id="APP-2025-0002",
            institution_id=inst_b.id,
            submitted_by_id=user_b.id,
            fdr_number="FDR-COLLISION-9999",
            bank_name="State Bank of India",
            amount=Decimal("1500000"),
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 1, 1),
            purpose="Affiliation Deposit",
            status=FDRStatus.SUBMITTED,
        )
        db.add_all([rec_a, rec_b])
        db.commit()

        dups = detect_all_duplicates(db)
        assert len(dups) >= 1
        cross_dups = [d for d in dups if "Cross-College" in d["duplicate_type"]]
        assert len(cross_dups) == 1
        assert cross_dups[0]["severity"] == "Critical"
        assert cross_dups[0]["flagged_fdr_number"] == "FDR-COLLISION-9999"

    def test_same_file_hash_detection(self, db):
        inst_a = make_inst(db, "Gamma Institute", "GI")
        inst_b = make_inst(db, "Delta College", "DC")
        user_a = make_user(db, "g@gi.edu", institution_id=inst_a.id)
        user_b = make_user(db, "d@dc.edu", institution_id=inst_b.id)

        rec_a = FDRRecord(
            application_id="APP-2025-0010",
            institution_id=inst_a.id,
            submitted_by_id=user_a.id,
            fdr_number="FDR-UNIQUE-A1",
            bank_name="HDFC Bank",
            amount=Decimal("1000000"),
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 1, 1),
            purpose="Deposit",
            status=FDRStatus.SUBMITTED,
        )
        rec_b = FDRRecord(
            application_id="APP-2025-0020",
            institution_id=inst_b.id,
            submitted_by_id=user_b.id,
            fdr_number="FDR-UNIQUE-B2",
            bank_name="HDFC Bank",
            amount=Decimal("1000000"),
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 1, 1),
            purpose="Deposit",
            status=FDRStatus.SUBMITTED,
        )
        db.add_all([rec_a, rec_b])
        db.flush()

        # Identical file hash attached to both
        identical_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        doc_a = Document(
            fdr_record_id=rec_a.id,
            uploaded_by_id=user_a.id,
            original_filename="Alpha_FDR.pdf",
            storage_key="fdr/10/doc1.pdf",
            file_size=12345,
            mime_type="application/pdf",
            document_type="fdr_certificate",
            file_hash=identical_hash,
        )
        doc_b = Document(
            fdr_record_id=rec_b.id,
            uploaded_by_id=user_b.id,
            original_filename="Beta_FDR_Copy.pdf",
            storage_key="fdr/20/doc2.pdf",
            file_size=12345,
            mime_type="application/pdf",
            document_type="fdr_certificate",
            file_hash=identical_hash,
        )
        db.add_all([doc_a, doc_b])
        db.commit()

        dups = detect_all_duplicates(db)
        file_dups = [d for d in dups if "File" in d["duplicate_type"]]
        assert len(file_dups) >= 1
        assert file_dups[0]["file_hash"] == identical_hash


# ─────────────────────────────────────────────────────────────────────────────
# Task 2: Required-Documents Checklist Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestChecklist:
    def test_missing_documents_flagged(self, db):
        inst = make_inst(db, "Checklist Tech", "CT")
        user = make_user(db, "user@ct.edu", institution_id=inst.id)

        rec = FDRRecord(
            application_id="APP-CHK-01",
            institution_id=inst.id,
            submitted_by_id=user.id,
            fdr_number="FDR-CHK-100",
            bank_name="Canara Bank",
            amount=Decimal("500000"),
            issue_date=date(2025, 1, 1),
            maturity_date=date(2026, 1, 1),
            purpose="Deposit",
            status=FDRStatus.DRAFT,
        )
        db.add(rec)
        db.flush()

        # No documents attached yet
        chk = evaluate_fdr_checklist(rec)
        assert chk["is_complete"] is False
        assert len(chk["missing_mandatory"]) == 3
        assert "fdr_certificate" in [m["code"] for m in chk["missing_mandatory"]]
        assert "joint_lien_letter" in [m["code"] for m in chk["missing_mandatory"]]
        assert "bank_covering_letter" in [m["code"] for m in chk["missing_mandatory"]]
        assert len(chk["flags"]) == 3

        # Attach FDR certificate
        doc1 = Document(
            fdr_record_id=rec.id,
            uploaded_by_id=user.id,
            original_filename="cert.pdf",
            storage_key="fdr/1/cert.pdf",
            file_size=1000,
            mime_type="application/pdf",
            document_type="fdr_certificate",
        )
        db.add(doc1)
        db.commit()
        db.refresh(rec)

        chk2 = evaluate_fdr_checklist(rec)
        assert chk2["is_complete"] is False
        assert chk2["mandatory_uploaded"] == 1
        assert len(chk2["missing_mandatory"]) == 2

        # Attach remaining mandatory documents
        doc2 = Document(
            fdr_record_id=rec.id,
            uploaded_by_id=user.id,
            original_filename="joint_lien.pdf",
            storage_key="fdr/1/lien.pdf",
            file_size=1000,
            mime_type="application/pdf",
            document_type="joint_lien_letter",
        )
        doc3 = Document(
            fdr_record_id=rec.id,
            uploaded_by_id=user.id,
            original_filename="covering.pdf",
            storage_key="fdr/1/covering.pdf",
            file_size=1000,
            mime_type="application/pdf",
            document_type="bank_covering_letter",
        )
        db.add_all([doc2, doc3])
        db.commit()
        db.refresh(rec)

        chk3 = evaluate_fdr_checklist(rec)
        assert chk3["is_complete"] is True
        assert len(chk3["missing_mandatory"]) == 0
        assert chk3["completion_percentage"] == 100
        assert chk3["status_label"] == "Complete"


# ─────────────────────────────────────────────────────────────────────────────
# Task 3: Renewal Chain Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestRenewalChain:
    def test_renewal_links_and_counts_once(self, db):
        inst = make_inst(db, "Renewal College", "RC")
        user = make_user(db, "r@rc.edu", institution_id=inst.id)

        # 1. Create root original FDR
        root = FDRRecord(
            application_id="APP-ROOT-001",
            institution_id=inst.id,
            submitted_by_id=user.id,
            fdr_number="FDR-ORIGINAL-001",
            bank_name="Bank of Baroda",
            amount=Decimal("1000000"),
            issue_date=date(2024, 1, 1),
            maturity_date=date(2025, 1, 1),
            purpose="Initial Deposit",
            status=FDRStatus.ACTIVE,
        )
        db.add(root)
        db.commit()

        # Check metrics before renewal: 1 active record, amount 1000000
        m1 = calculate_active_metrics(db, institution_id=inst.id)
        assert m1["total_records"] == 1
        assert m1["active_records_count"] == 1
        assert m1["active_escrow_amount"] == 1000000.0

        # 2. Renew the FDR
        renewal = create_fdr_renewal(
            db=db,
            old_fdr_id=root.id,
            renewal_payload={
                "fdr_number": "FDR-RENEWED-001",
                "amount": Decimal("1000000"),
                "maturity_date": date(2026, 1, 1),
            },
            actor=user,
        )
        db.refresh(root)

        # Check linking
        assert renewal.parent_fdr_id == root.id
        assert root.status == FDRStatus.RENEWED

        # Transition renewal to ACTIVE
        renewal.status = FDRStatus.ACTIVE
        db.commit()

        # Check chain traversal
        chain_info = get_renewal_chain(db, renewal.id)
        assert chain_info["total_nodes_in_chain"] == 2
        assert chain_info["root_id"] == root.id
        assert chain_info["chain"][0]["fdr_number"] == "FDR-ORIGINAL-001"
        assert chain_info["chain"][1]["fdr_number"] == "FDR-RENEWED-001"

        # Check counting rule: "A renewal links to old FDR and counts once"
        # Total records = 2, but unique lineages = 1, active records count = 1, active escrow = 1,000,000 (not 2,000,000!)
        m2 = calculate_active_metrics(db, institution_id=inst.id)
        assert m2["total_records"] == 2
        assert m2["unique_lineages_count"] == 1
        assert m2["active_records_count"] == 1
        assert m2["active_escrow_amount"] == 1000000.0
        assert m2["renewed_records_superseded_count"] == 1
        assert m2["renewed_amount_excluded"] == 1000000.0


# ─────────────────────────────────────────────────────────────────────────────
# Task 4: OCR Tests
# ─────────────────────────────────────────────────────────────────────────────
class TestOCR:
    def test_ocr_extracts_all_fdr_fields_from_pdf(self):
        # Generate synthetic authentic PDF
        pdf_bytes = generate_sample_fdr_pdf(
            fdr_number="FDR-2025-OCR-88219",
            bank_name="State Bank of India",
            amount=1500000.0,
            issue_date="2025-04-01",
            maturity_date="2026-04-01",
            college_name="Demo Institute of Technology",
            has_lien=True,
        )
        assert len(pdf_bytes) > 500

        # Run OCR extraction
        res = extract_fdr_from_pdf(pdf_bytes)
        assert res["success"] is True
        assert res["fdr_number"] == "FDR-2025-OCR-88219"
        assert res["bank_name"] == "State Bank of India"
        assert res["amount"] == 1500000.0
        assert res["issue_date"] == "2025-04-01"
        assert res["maturity_date"] == "2026-04-01"
        assert res["joint_lien_detected"] is True
        assert res["confidence"] >= 0.85
