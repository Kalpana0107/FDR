"""
Tests for the 6 new backend modules.

Each new endpoint has:
  - happy-path test
  - wrong-role test (403)
  - wrong-college test (403) where applicable
  - business-rule violation test (409 / 422)

Uses the same SQLite in-memory fixture from test_main.py.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Institution, FDRRecord, FDRStatus
from datetime import date


# ─────────────────────────────────────────────
# Test DB setup (SQLite in-memory)
# ─────────────────────────────────────────────
TEST_DB_URL = "sqlite:///./test_new_modules.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─────────────────────────────────────────────
# Seed helpers
# ─────────────────────────────────────────────
def make_inst(db, name="College A", code="CA001"):
    inst = Institution(name=name, code=code, city="Pune", state="MH")
    db.add(inst)
    db.flush()
    return inst


def make_user(db, email, role=UserRole.COLLEGE_USER, inst_id=None):
    u = User(
        email=email,
        full_name="Test User",
        hashed_password=get_password_hash("Test@1234"),
        role=role,
        is_active=True,
        institution_id=inst_id,
    )
    db.add(u)
    db.flush()
    return u


def token(client, email, pwd="Test@1234"):
    r = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert r.status_code == 200, r.json()
    return r.json()["access_token"]


def auth(tok):
    return {"Authorization": f"Bearer {tok}"}


def make_fdr(db, inst_id, user_id, status=FDRStatus.SUBMITTED,
             fdr_number="FDR-2025-000101"):
    f = FDRRecord(
        application_id=f"APP-{fdr_number}",
        institution_id=inst_id,
        submitted_by_id=user_id,
        fdr_number=fdr_number,
        bank_name="Sample Bank of India",
        branch_name="Main Branch",
        amount=1500000,
        currency="INR",
        issue_date=date(2025, 4, 1),
        maturity_date=date(2026, 4, 1),
        purpose="Security deposit",
        status=status,
    )
    db.add(f)
    db.flush()
    return f


# ═══════════════════════════════════════════════════════════════════
# Task 1: Audit chain
# ═══════════════════════════════════════════════════════════════════

class TestAuditChain:
    def test_verify_chain_empty(self, client, db):
        inst = make_inst(db)
        admin = make_user(db, "admin@t.com", UserRole.OFFICER, inst.id)
        db.commit()
        tok = token(client, "admin@t.com")
        r = client.get("/api/v1/audit/verify-chain", headers=auth(tok))
        assert r.status_code == 200
        data = r.json()
        assert data["is_valid"] is True
        assert data["total_records"] == 0

    def test_verify_chain_wrong_role(self, client, db):
        inst = make_inst(db)
        college = make_user(db, "college@t.com", UserRole.COLLEGE_USER, inst.id)
        db.commit()
        tok = token(client, "college@t.com")
        r = client.get("/api/v1/audit/verify-chain", headers=auth(tok))
        assert r.status_code == 403

    def test_chain_list_admin_only(self, client, db):
        inst = make_inst(db)
        make_user(db, "verifier@t.com", UserRole.BANK_VERIFIER, inst.id)
        db.commit()
        tok = token(client, "verifier@t.com")
        r = client.get("/api/v1/audit/chain", headers=auth(tok))
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════
# Task 2: Bank verification
# ═══════════════════════════════════════════════════════════════════

class TestBankVerify:
    def test_verify_bank_passes(self, client, db):
        inst = make_inst(db, name="Sample Institute of Technology, Pune")
        verifier = make_user(db, "bv@t.com", UserRole.BANK_VERIFIER, inst.id)
        college = make_user(db, "col@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.SUBMITTED)
        db.commit()
        tok = token(client, "bv@t.com")
        r = client.post(f"/api/v1/fdr/{fdr.id}/verify-bank", headers=auth(tok))
        assert r.status_code == 200
        assert r.json()["result"] in ("VERIFIED", "FAILED", "VERIFICATION_PENDING")

    def test_verify_bank_simulate_outage(self, client, db):
        inst = make_inst(db)
        verifier = make_user(db, "bv2@t.com", UserRole.BANK_VERIFIER, inst.id)
        college = make_user(db, "col2@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.SUBMITTED)
        db.commit()
        tok = token(client, "bv2@t.com")
        r = client.post(
            f"/api/v1/fdr/{fdr.id}/verify-bank?simulate_outage=true",
            headers=auth(tok),
        )
        assert r.status_code == 200
        assert r.json()["result"] == "VERIFICATION_PENDING"
        assert r.json()["retry_after_seconds"] is not None

    def test_verify_bank_college_forbidden(self, client, db):
        inst = make_inst(db)
        college = make_user(db, "col3@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.SUBMITTED)
        db.commit()
        tok = token(client, "col3@t.com")
        r = client.post(f"/api/v1/fdr/{fdr.id}/verify-bank", headers=auth(tok))
        assert r.status_code == 403

    def test_verify_bank_wrong_status(self, client, db):
        inst = make_inst(db)
        verifier = make_user(db, "bv3@t.com", UserRole.BANK_VERIFIER, inst.id)
        college = make_user(db, "col4@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.RELEASED)
        db.commit()
        tok = token(client, "bv3@t.com")
        r = client.post(f"/api/v1/fdr/{fdr.id}/verify-bank", headers=auth(tok))
        assert r.status_code == 409


# ═══════════════════════════════════════════════════════════════════
# Task 3: Demo clock + reminders
# ═══════════════════════════════════════════════════════════════════

class TestDemoClock:
    def test_get_clock_state(self, client, db):
        make_user(db, "admin2@t.com", UserRole.OFFICER)
        db.commit()
        tok = token(client, "admin2@t.com")
        r = client.get("/api/v1/admin/demo-clock", headers=auth(tok))
        assert r.status_code == 200
        assert "offset_days" in r.json()

    def test_fast_forward(self, client, db):
        make_user(db, "admin3@t.com", UserRole.OFFICER)
        db.commit()
        tok = token(client, "admin3@t.com")
        r = client.post("/api/v1/admin/demo-clock/fast-forward",
                        json={"days": 45}, headers=auth(tok))
        assert r.status_code == 200
        # Reset immediately so other tests aren't affected
        client.post("/api/v1/admin/demo-clock/reset", headers=auth(tok))

    def test_clock_college_forbidden(self, client, db):
        inst = make_inst(db, code="CB002")
        make_user(db, "col5@t.com", UserRole.COLLEGE_USER, inst.id)
        db.commit()
        tok = token(client, "col5@t.com")
        r = client.get("/api/v1/admin/demo-clock", headers=auth(tok))
        assert r.status_code == 403

    def test_trigger_reminders_empty(self, client, db):
        make_user(db, "admin4@t.com", UserRole.OFFICER)
        db.commit()
        tok = token(client, "admin4@t.com")
        r = client.post("/api/v1/reminders/trigger-check", headers=auth(tok))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ═══════════════════════════════════════════════════════════════════
# Task 4: Two-person release
# ═══════════════════════════════════════════════════════════════════

class TestRelease:
    def _setup(self, db):
        inst = make_inst(db, name="ReleaseInst", code="RI001")
        college = make_user(db, "rel_col@t.com", UserRole.COLLEGE_USER, inst.id)
        approver = make_user(db, "rel_app@t.com", UserRole.APPROVER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.ACTIVE)
        db.commit()
        return college, approver, fdr

    def test_request_release_college(self, client, db):
        college, approver, fdr = self._setup(db)
        tok = token(client, "rel_col@t.com")
        r = client.post(
            f"/api/v1/fdr/{fdr.id}/request-release",
            json={"reason": "Course completed"},
            headers=auth(tok),
        )
        assert r.status_code == 201
        assert r.json()["status"] == "REQUESTED"

    def test_approve_release_two_person_rule(self, client, db):
        college, approver, fdr = self._setup(db)
        tok_col = token(client, "rel_col@t.com")
        tok_app = token(client, "rel_app@t.com")
        # Step 1 – request
        r1 = client.post(
            f"/api/v1/fdr/{fdr.id}/request-release",
            json={"reason": "Done"},
            headers=auth(tok_col),
        )
        assert r1.status_code == 201
        # Step 2 – approve with different user
        r2 = client.post(
            f"/api/v1/fdr/{fdr.id}/approve-release",
            json={"decision_remark": "Verified"},
            headers=auth(tok_app),
        )
        assert r2.status_code == 200
        assert r2.json()["status"] == "APPROVED"

    def test_self_approve_rejected(self, client, db):
        """Same user cannot request AND approve."""
        inst = make_inst(db, name="SelfApproveInst", code="SA001")
        officer = make_user(db, "sa_off@t.com", UserRole.OFFICER, inst.id)
        college = make_user(db, "sa_col@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.ACTIVE,
                       fdr_number="FDR-SELF-001")
        db.commit()
        tok_off = token(client, "sa_off@t.com")
        client.post(
            f"/api/v1/fdr/{fdr.id}/request-release",
            json={"reason": "Test"},
            headers=auth(tok_off),
        )
        r = client.post(
            f"/api/v1/fdr/{fdr.id}/approve-release",
            json={"decision_remark": "Self"},
            headers=auth(tok_off),
        )
        assert r.status_code == 422

    def test_release_wrong_college(self, client, db):
        inst_a = make_inst(db, name="InstA", code="IA001")
        inst_b = make_inst(db, name="InstB", code="IB001")
        col_a = make_user(db, "col_a@t.com", UserRole.COLLEGE_USER, inst_a.id)
        col_b = make_user(db, "col_b@t.com", UserRole.COLLEGE_USER, inst_b.id)
        fdr = make_fdr(db, inst_a.id, col_a.id, FDRStatus.ACTIVE,
                       fdr_number="FDR-WRONG-001")
        db.commit()
        tok_b = token(client, "col_b@t.com")
        r = client.post(
            f"/api/v1/fdr/{fdr.id}/request-release",
            json={"reason": "Hack attempt"},
            headers=auth(tok_b),
        )
        assert r.status_code == 403

    def test_release_wrong_fdr_status(self, client, db):
        inst = make_inst(db, name="WrongStatInst", code="WS001")
        college = make_user(db, "ws_col@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, FDRStatus.SUBMITTED,
                       fdr_number="FDR-STAT-001")
        db.commit()
        tok = token(client, "ws_col@t.com")
        r = client.post(
            f"/api/v1/fdr/{fdr.id}/request-release",
            json={},
            headers=auth(tok),
        )
        assert r.status_code == 409


# ═══════════════════════════════════════════════════════════════════
# Task 5: Version history & receipts
# ═══════════════════════════════════════════════════════════════════

class TestVersionsReceipts:
    def test_get_versions_empty(self, client, db):
        inst = make_inst(db, name="VerInst", code="VR001")
        college = make_user(db, "ver_col@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id)
        db.commit()
        tok = token(client, "ver_col@t.com")
        r = client.get(f"/api/v1/fdr/{fdr.id}/versions", headers=auth(tok))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_versions_wrong_college(self, client, db):
        inst_a = make_inst(db, name="VInstA", code="VIA001")
        inst_b = make_inst(db, name="VInstB", code="VIB001")
        col_a = make_user(db, "va_col@t.com", UserRole.COLLEGE_USER, inst_a.id)
        col_b = make_user(db, "vb_col@t.com", UserRole.COLLEGE_USER, inst_b.id)
        fdr = make_fdr(db, inst_a.id, col_a.id, fdr_number="FDR-V-001")
        db.commit()
        tok_b = token(client, "vb_col@t.com")
        r = client.get(f"/api/v1/fdr/{fdr.id}/versions", headers=auth(tok_b))
        assert r.status_code == 403

    def test_get_receipt(self, client, db):
        inst = make_inst(db, name="RecInst", code="RC001")
        college = make_user(db, "rec_col@t.com", UserRole.COLLEGE_USER, inst.id)
        fdr = make_fdr(db, inst.id, college.id, fdr_number="FDR-REC-001")
        db.commit()
        tok = token(client, "rec_col@t.com")
        r = client.get(f"/api/v1/fdr/{fdr.id}/receipt", headers=auth(tok))
        assert r.status_code == 200
        data = r.json()
        assert "qr_payload" in data
        assert data["simulated"] is True

    def test_verify_receipt_not_found(self, client, db):
        r = client.get("/api/v1/receipts/verify?token=deadbeef&fdr_id=99999")
        assert r.status_code == 200
        assert r.json()["valid"] is False


# ═══════════════════════════════════════════════════════════════════
# Task 6: Analytics dashboard
# ═══════════════════════════════════════════════════════════════════

class TestAnalytics:
    def test_dashboard_stats(self, client, db):
        make_user(db, "dash_admin@t.com", UserRole.OFFICER)
        db.commit()
        tok = token(client, "dash_admin@t.com")
        r = client.get("/api/v1/dashboard/stats", headers=auth(tok))
        assert r.status_code == 200
        data = r.json()
        assert "verified_count" in data
        assert "total_active_value" in data

    def test_dashboard_radar(self, client, db):
        make_user(db, "radar_admin@t.com", UserRole.MANAGEMENT)
        db.commit()
        tok = token(client, "radar_admin@t.com")
        r = client.get("/api/v1/dashboard/radar", headers=auth(tok))
        assert r.status_code == 200
        data = r.json()
        assert "bank_concentration_risk" in data
        assert "release_compliance_rate" in data

    def test_dashboard_stats_wrong_role(self, client, db):
        inst = make_inst(db, name="DashInst", code="DI001")
        make_user(db, "dash_col@t.com", UserRole.COLLEGE_USER, inst.id)
        db.commit()
        tok = token(client, "dash_col@t.com")
        r = client.get("/api/v1/dashboard/stats", headers=auth(tok))
        assert r.status_code == 403

    def test_dashboard_radar_wrong_role(self, client, db):
        inst = make_inst(db, name="RadarInst", code="RI002")
        make_user(db, "radar_col@t.com", UserRole.COLLEGE_USER, inst.id)
        db.commit()
        tok = token(client, "radar_col@t.com")
        r = client.get("/api/v1/dashboard/radar", headers=auth(tok))
        assert r.status_code == 403
