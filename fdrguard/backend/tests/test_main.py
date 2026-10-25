"""
Backend test suite using pytest + httpx TestClient.
Run with: pytest tests/ -v
"""
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Institution, FDRRecord, FDRStatus

# ─────────────────────────────────────────────
# Test DB setup (SQLite in-memory)
# ─────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_fdrguard.db"
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


# ─────────────────────────────────────────────
# Seed helpers
# ─────────────────────────────────────────────
def make_institution(db, name="Test College", code="TC001"):
    inst = Institution(name=name, code=code, city="Test City", state="Test State")
    db.add(inst)
    db.flush()
    return inst


def make_user(db, email, role=UserRole.COLLEGE_USER, institution_id=None, password="Test@1234"):
    user = User(
        email=email,
        full_name="Test User",
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
        institution_id=institution_id,
    )
    db.add(user)
    db.flush()
    return user


def get_token(client, email, password="Test@1234"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.json()
    return r.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


VALID_FDR_PAYLOAD = {
    "fdr_number": "FDR-TEST-0001",
    "bank_name": "State Bank of India",
    "branch_name": "Main Branch",
    "amount": "500000.00",
    "currency": "INR",
    "issue_date": "2025-01-01",
    "maturity_date": "2026-01-01",
    "purpose": "Security Deposit for Affiliation",
    "remarks": "Test remark",
}


# ─────────────────────────────────────────────
# Authentication tests
# ─────────────────────────────────────────────
class TestAuthentication:
    def test_login_success(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "test@college.edu", institution_id=inst.id)
        db.commit()
        r = client.post("/api/auth/login", json={"email": "test@college.edu", "password": "Test@1234"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "test2@college.edu", institution_id=inst.id)
        db.commit()
        r = client.post("/api/auth/login", json={"email": "test2@college.edu", "password": "wrong"})
        assert r.status_code == 401

    def test_login_nonexistent_user(self, client, db):
        r = client.post("/api/auth/login", json={"email": "nobody@x.com", "password": "pass"})
        assert r.status_code == 401

    def test_me_requires_auth(self, client, db):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_returns_user_info(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "me@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "me@college.edu")
        r = client.get("/api/auth/me", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["email"] == "me@college.edu"


# ─────────────────────────────────────────────
# FDR CRUD tests
# ─────────────────────────────────────────────
class TestFDRCreate:
    def test_create_fdr_as_college_user(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "c@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "c@college.edu")
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == FDRStatus.DRAFT.value
        assert data["fdr_number"] == "FDR-TEST-0001"
        assert "application_id" in data

    def test_create_fdr_invalid_amount(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "c2@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "c2@college.edu")
        bad_payload = {**VALID_FDR_PAYLOAD, "amount": "-100"}
        r = client.post("/api/fdr/", json=bad_payload, headers=auth_header(token))
        assert r.status_code == 422

    def test_create_fdr_bad_dates(self, client, db):
        inst = make_institution(db)
        db.commit()
        make_user(db, "c3@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "c3@college.edu")
        bad_payload = {**VALID_FDR_PAYLOAD, "issue_date": "2026-01-01", "maturity_date": "2025-01-01"}
        r = client.post("/api/fdr/", json=bad_payload, headers=auth_header(token))
        assert r.status_code == 422


# ─────────────────────────────────────────────
# Access control tests
# ─────────────────────────────────────────────
class TestAccessControl:
    def test_college_a_cannot_see_college_b_record(self, client, db):
        inst_a = make_institution(db, "College A", "CA001")
        inst_b = make_institution(db, "College B", "CB001")
        db.commit()
        user_a = make_user(db, "a@a.edu", institution_id=inst_a.id)
        user_b = make_user(db, "b@b.edu", institution_id=inst_b.id)
        db.commit()

        # Create record for college B
        token_b = get_token(client, "b@b.edu")
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token_b))
        assert r.status_code == 201
        fdr_id = r.json()["id"]

        # College A tries to access it
        token_a = get_token(client, "a@a.edu")
        r2 = client.get(f"/api/fdr/{fdr_id}", headers=auth_header(token_a))
        assert r2.status_code == 403

    def test_college_user_cannot_access_admin_status_endpoint(self, client, db):
        inst = make_institution(db)
        db.commit()
        user = make_user(db, "cu@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "cu@college.edu")

        # Create and submit
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        fdr_id = r.json()["id"]
        client.post(f"/api/fdr/{fdr_id}/submit", headers=auth_header(token))

        # Try admin-only status update
        r2 = client.post(
            f"/api/fdr/{fdr_id}/status",
            json={"new_status": FDRStatus.VERIFIED.value},
            headers=auth_header(token),
        )
        assert r2.status_code == 403

    def test_college_user_cannot_mark_own_record_verified(self, client, db):
        inst = make_institution(db)
        db.commit()
        user = make_user(db, "cu2@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "cu2@college.edu")

        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        fdr_id = r.json()["id"]
        client.post(f"/api/fdr/{fdr_id}/submit", headers=auth_header(token))

        r2 = client.post(
            f"/api/fdr/{fdr_id}/status",
            json={"new_status": FDRStatus.VERIFIED.value},
            headers=auth_header(token),
        )
        assert r2.status_code == 403


# ─────────────────────────────────────────────
# Status transition tests
# ─────────────────────────────────────────────
class TestStatusTransitions:
    def _create_and_submit(self, client, db):
        inst = make_institution(db, "Trans College", "TC-TR")
        admin = make_user(db, "admin@aicte.gov.in", role=UserRole.ADMIN)
        user = make_user(db, "user@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "user@college.edu")
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        fdr_id = r.json()["id"]
        client.post(f"/api/fdr/{fdr_id}/submit", headers=auth_header(token))
        admin_token = get_token(client, "admin@aicte.gov.in")
        return fdr_id, token, admin_token

    def test_full_verify_workflow(self, client, db):
        fdr_id, col_token, adm_token = self._create_and_submit(client, db)
        # Admin: Submitted -> Under Review
        r = client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.UNDER_REVIEW.value}, headers=auth_header(adm_token))
        assert r.status_code == 200
        assert r.json()["status"] == FDRStatus.UNDER_REVIEW.value
        # Admin: Under Review -> Verified
        r = client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.VERIFIED.value}, headers=auth_header(adm_token))
        assert r.status_code == 200
        assert r.json()["status"] == FDRStatus.VERIFIED.value

    def test_return_requires_remark(self, client, db):
        fdr_id, col_token, adm_token = self._create_and_submit(client, db)
        client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.UNDER_REVIEW.value}, headers=auth_header(adm_token))
        r = client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.RETURNED.value}, headers=auth_header(adm_token))
        assert r.status_code == 422

    def test_return_with_remark_succeeds(self, client, db):
        fdr_id, col_token, adm_token = self._create_and_submit(client, db)
        client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.UNDER_REVIEW.value}, headers=auth_header(adm_token))
        r = client.post(
            f"/api/fdr/{fdr_id}/status",
            json={"new_status": FDRStatus.RETURNED.value, "remark": "Please correct FDR number"},
            headers=auth_header(adm_token),
        )
        assert r.status_code == 200
        assert r.json()["status"] == FDRStatus.RETURNED.value

    def test_resubmit_returned_record(self, client, db):
        fdr_id, col_token, adm_token = self._create_and_submit(client, db)
        client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.UNDER_REVIEW.value}, headers=auth_header(adm_token))
        client.post(
            f"/api/fdr/{fdr_id}/status",
            json={"new_status": FDRStatus.RETURNED.value, "remark": "Fix FDR number"},
            headers=auth_header(adm_token),
        )
        # College resubmits
        r = client.post(f"/api/fdr/{fdr_id}/submit", headers=auth_header(col_token))
        assert r.status_code == 200
        assert r.json()["status"] == FDRStatus.SUBMITTED.value

    def test_invalid_transition_draft_to_verified(self, client, db):
        inst = make_institution(db, "Inv College", "IC001")
        db.commit()
        make_user(db, "inv@college.edu", institution_id=inst.id)
        make_user(db, "adm2@aicte.gov.in", role=UserRole.ADMIN)
        db.commit()
        token = get_token(client, "inv@college.edu")
        adm_token = get_token(client, "adm2@aicte.gov.in")
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        fdr_id = r.json()["id"]
        r2 = client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.VERIFIED.value}, headers=auth_header(adm_token))
        assert r2.status_code == 422

    def test_rejection_requires_remark(self, client, db):
        fdr_id, col_token, adm_token = self._create_and_submit(client, db)
        client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.UNDER_REVIEW.value}, headers=auth_header(adm_token))
        r = client.post(f"/api/fdr/{fdr_id}/status", json={"new_status": FDRStatus.REJECTED.value}, headers=auth_header(adm_token))
        assert r.status_code == 422


# ─────────────────────────────────────────────
# Dashboard stats tests
# ─────────────────────────────────────────────
class TestDashboardStats:
    def test_college_stats_reflect_db(self, client, db):
        inst = make_institution(db, "Stats College", "SC001")
        db.commit()
        make_user(db, "stats@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "stats@college.edu")
        # Create 2 drafts
        client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        client.post("/api/fdr/", json={**VALID_FDR_PAYLOAD, "fdr_number": "FDR-002"}, headers=auth_header(token))
        r = client.get("/api/fdr/stats/college", headers=auth_header(token))
        assert r.status_code == 200
        stats = r.json()
        assert stats["total"] == 2
        assert stats["draft"] == 2

    def test_admin_stats(self, client, db):
        make_user(db, "adm3@aicte.gov.in", role=UserRole.ADMIN)
        db.commit()
        adm_token = get_token(client, "adm3@aicte.gov.in")
        r = client.get("/api/fdr/stats/admin", headers=auth_header(adm_token))
        assert r.status_code == 200
        assert "total_submitted" in r.json()


# ─────────────────────────────────────────────
# Upload validation tests
# ─────────────────────────────────────────────
class TestUploadValidation:
    def _setup(self, client, db):
        inst = make_institution(db, "Upload College", "UC001")
        db.commit()
        make_user(db, "uploader@college.edu", institution_id=inst.id)
        db.commit()
        token = get_token(client, "uploader@college.edu")
        r = client.post("/api/fdr/", json=VALID_FDR_PAYLOAD, headers=auth_header(token))
        fdr_id = r.json()["id"]
        return fdr_id, token

    def _make_pdf_bytes(self) -> bytes:
        """Return minimal valid PDF bytes."""
        return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\ntrailer\n<< /Size 2 >>\n%%EOF"

    def test_upload_valid_pdf(self, client, db):
        fdr_id, token = self._setup(client, db)
        pdf_bytes = self._make_pdf_bytes()
        r = client.post(
            f"/api/fdr/{fdr_id}/documents",
            headers=auth_header(token),
            files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
            data={"document_type": "fdr_document"},
        )
        assert r.status_code == 201

    def test_upload_non_pdf_extension_rejected(self, client, db):
        fdr_id, token = self._setup(client, db)
        pdf_bytes = self._make_pdf_bytes()
        r = client.post(
            f"/api/fdr/{fdr_id}/documents",
            headers=auth_header(token),
            files={"file": ("test.jpg", io.BytesIO(pdf_bytes), "image/jpeg")},
            data={"document_type": "fdr_document"},
        )
        assert r.status_code == 415

    def test_upload_pdf_extension_but_wrong_content_rejected(self, client, db):
        fdr_id, token = self._setup(client, db)
        fake_content = b"\xff\xd8\xff\xe0" + b"\x00" * 100  # JPEG magic bytes
        r = client.post(
            f"/api/fdr/{fdr_id}/documents",
            headers=auth_header(token),
            files={"file": ("test.pdf", io.BytesIO(fake_content), "application/pdf")},
            data={"document_type": "fdr_document"},
        )
        assert r.status_code == 415

    def test_upload_oversized_file_rejected(self, client, db):
        fdr_id, token = self._setup(client, db)
        # Create a file slightly over 10 MB
        large_content = b"%PDF-1.4\n" + b"x" * (10 * 1024 * 1024 + 1)
        r = client.post(
            f"/api/fdr/{fdr_id}/documents",
            headers=auth_header(token),
            files={"file": ("big.pdf", io.BytesIO(large_content), "application/pdf")},
            data={"document_type": "fdr_document"},
        )
        assert r.status_code == 413
