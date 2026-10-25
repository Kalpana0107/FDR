"""
bank_adapter.py — simulated CBS (Core Banking System) adapter.

All verification is **Simulated**. The UI must label any output
from this service with a "Simulated" badge per UI_GUIDE.md.

Behaviour is controlled by:
  - The `simulate_outage` flag passed to `verify_fdr()`, OR
  - The query-parameter `?simulate_outage=true` used in the route handler.

Match logic:
  All five fields must match exactly (case-insensitive for strings,
  exact for amounts/dates). Any mismatch -> FAILED with a diff list.
"""
import json
import random
import string
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Optional


SIMULATED_BANK_DB: dict[str, dict] = {
    # key = fdr_number (uppercase)
    # These are synthetic records matching the mock fdrs.js data
    "FDR-2025-000101": {
        "fdr_number": "FDR-2025-000101",
        "principal_amount": Decimal("1500000.00"),
        "bank_name": "Sample Bank of India",
        "maturity_date": date(2026, 4, 1),
        "account_holder_name": "Sample Institute of Technology, Pune",
    },
    "FDR-2025-000202": {
        "fdr_number": "FDR-2025-000202",
        "principal_amount": Decimal("2500000.00"),
        "bank_name": "Allied Bank of Commerce",
        "maturity_date": date(2026, 6, 30),
        "account_holder_name": "Prestige Engineering College, Bangalore",
    },
}


@dataclass
class BankCheckResult:
    status: str           # "VERIFIED" | "FAILED" | "VERIFICATION_PENDING"
    simulated: bool = True
    bank_ref: Optional[str] = None
    submitted_snapshot: Optional[dict] = None
    bank_snapshot: Optional[dict] = None
    discrepancies: list[str] = None
    retry_after_seconds: Optional[int] = None
    outage_reason: Optional[str] = None

    def __post_init__(self):
        if self.discrepancies is None:
            self.discrepancies = []


def _random_ref() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"CBS-SIM-{suffix}"


def verify_fdr(
    fdr_number: str,
    principal_amount: Decimal,
    bank_name: str,
    maturity_date: date,
    account_holder_name: str,
    simulate_outage: bool = False,
) -> BankCheckResult:
    """
    Run a simulated CBS verification.

    If `simulate_outage` is True -> returns VERIFICATION_PENDING with retry metadata.
    Otherwise: looks up fdr_number, compares all 5 fields.
    """
    submitted = {
        "fdr_number": fdr_number,
        "principal_amount": str(principal_amount),
        "bank_name": bank_name,
        "maturity_date": maturity_date.isoformat(),
        "account_holder_name": account_holder_name,
    }

    if simulate_outage:
        return BankCheckResult(
            status="VERIFICATION_PENDING",
            simulated=True,
            submitted_snapshot=submitted,
            retry_after_seconds=300,
            outage_reason="Simulated bank CBS gateway timeout. Retry after 5 minutes.",
        )

    bank_record = SIMULATED_BANK_DB.get(fdr_number.upper())
    if not bank_record:
        # Unknown FDR — treat as mismatch
        return BankCheckResult(
            status="FAILED",
            simulated=True,
            submitted_snapshot=submitted,
            bank_snapshot=None,
            discrepancies=["fdr_number"],
        )

    bank_snap = {
        "fdr_number": bank_record["fdr_number"],
        "principal_amount": str(bank_record["principal_amount"]),
        "bank_name": bank_record["bank_name"],
        "maturity_date": bank_record["maturity_date"].isoformat(),
        "account_holder_name": bank_record["account_holder_name"],
    }

    diffs: list[str] = []
    if fdr_number.upper() != bank_record["fdr_number"].upper():
        diffs.append("fdr_number")
    if Decimal(str(principal_amount)) != bank_record["principal_amount"]:
        diffs.append("principal_amount")
    if bank_name.strip().lower() != bank_record["bank_name"].strip().lower():
        diffs.append("bank_name")
    if maturity_date != bank_record["maturity_date"]:
        diffs.append("maturity_date")
    if account_holder_name.strip().lower() != bank_record["account_holder_name"].strip().lower():
        diffs.append("account_holder_name")

    if diffs:
        return BankCheckResult(
            status="FAILED",
            simulated=True,
            submitted_snapshot=submitted,
            bank_snapshot=bank_snap,
            discrepancies=diffs,
        )

    return BankCheckResult(
        status="VERIFIED",
        simulated=True,
        bank_ref=_random_ref(),
        submitted_snapshot=submitted,
        bank_snapshot=bank_snap,
        discrepancies=[],
    )
