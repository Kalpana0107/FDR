"""
Required-documents checklist service for FDRGuard.

Compliance rules for AICTE Fixed Deposit Receipt submissions:
- Mandatory:
  1. fdr_certificate: Original Deposit Receipt copy issued by the scheduled bank.
  2. joint_lien_letter: AICTE Joint Lien Undertaking / Endorsement letter from bank.
  3. bank_covering_letter: Official Bank Confirmation / Covering letter with branch IFSC & official seal.
- Optional / Conditional:
  4. board_resolution: College Governing Body / Trust Resolution authorizing security deposit.
"""
from typing import Dict, Any, List, Optional
from ..models.fdr import FDRRecord


REQUIRED_DOCUMENTS_SPEC = [
    {
        "code": "fdr_certificate",
        "name": "Fixed Deposit Receipt (FDR Certificate)",
        "is_mandatory": True,
        "description": "Scanned original FDR issued in joint name with Regional Officer / Member Secretary, AICTE.",
    },
    {
        "code": "joint_lien_letter",
        "name": "Bank Joint-Lien Endorsement Letter",
        "is_mandatory": True,
        "description": "Explicit confirmation letter from bank confirming tripartite AICTE lien and lock-in period.",
    },
    {
        "code": "bank_covering_letter",
        "name": "Bank Confirmation & Covering Letter",
        "is_mandatory": True,
        "description": "Official bank branch covering letter with IFSC code, branch ledger folio, and authorized manager seal.",
    },
    {
        "code": "board_resolution",
        "name": "Governing Body / Trust Resolution",
        "is_mandatory": False,
        "description": "Extract of resolution passed by sponsoring trust/society authorizing creation of the security deposit.",
    },
]


def evaluate_fdr_checklist(record: FDRRecord) -> Dict[str, Any]:
    """
    Evaluate the required-documents checklist for an FDR record.
    Returns completeness state, list of missing mandatory documents,
    missing optional documents, and detailed item checklist.
    """
    uploaded_docs = record.documents or []

    # Map document_type to list of uploaded files
    uploaded_by_type: Dict[str, List[Dict[str, Any]]] = {}
    for d in uploaded_docs:
        doc_type = d.document_type or "fdr_certificate"
        # Map legacy "fdr_document" to "fdr_certificate"
        if doc_type in ("fdr_document", "fdr_cert"):
            doc_type = "fdr_certificate"

        uploaded_by_type.setdefault(doc_type, []).append({
            "id": d.id,
            "filename": d.original_filename,
            "size": d.file_size,
            "file_hash": d.file_hash,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        })

    checklist_items = []
    missing_mandatory = []
    missing_optional = []

    mandatory_count = 0
    mandatory_uploaded_count = 0

    for spec in REQUIRED_DOCUMENTS_SPEC:
        code = spec["code"]
        is_mand = spec["is_mandatory"]
        if is_mand:
            mandatory_count += 1

        matches = uploaded_by_type.get(code, [])
        is_present = len(matches) > 0

        if is_mand and is_present:
            mandatory_uploaded_count += 1
        elif is_mand and not is_present:
            missing_mandatory.append({
                "code": code,
                "name": spec["name"],
                "description": spec["description"],
            })
        elif not is_mand and not is_present:
            missing_optional.append({
                "code": code,
                "name": spec["name"],
                "description": spec["description"],
            })

        checklist_items.append({
            "code": code,
            "name": spec["name"],
            "is_mandatory": is_mand,
            "description": spec["description"],
            "status": "UPLOADED" if is_present else "MISSING",
            "files": matches,
        })

    is_complete = len(missing_mandatory) == 0
    percentage = int((mandatory_uploaded_count / max(1, mandatory_count)) * 100)

    if is_complete:
        status_label = "Complete"
    elif mandatory_uploaded_count > 0:
        status_label = "Partially Complete"
    else:
        status_label = "Action Required: Missing Documents"

    return {
        "is_complete": is_complete,
        "status_label": status_label,
        "completion_percentage": percentage,
        "mandatory_total": mandatory_count,
        "mandatory_uploaded": mandatory_uploaded_count,
        "missing_mandatory": missing_mandatory,
        "missing_optional": missing_optional,
        "items": checklist_items,
        "flags": [
            f"Missing required document: {item['name']}"
            for item in missing_mandatory
        ],
    }
