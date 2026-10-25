"""
OCR and PDF parsing service for FDRGuard.

Extracts:
1. FDR Number (certificate / receipt number).
2. Bank Name (scheduled commercial or public sector bank).
3. Amount (principal deposit amount in INR).
4. Dates (issue/deposit date and maturity date).
5. Joint-Lien clause (AICTE joint endorsement check).

Also provides synthetic PDF certificate generator for testing and demonstration.
"""
import io
import re
from datetime import datetime, date
from typing import Dict, Any, Optional
import pypdf

# Supported Indian Banks dictionary for recognition
KNOWN_BANKS = [
    "State Bank of India",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
    "Central Bank of India",
    "Indian Overseas Bank",
    "UCO Bank",
    "Bank of Maharashtra",
    "Punjab & Sind Bank",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Federal Bank",
    "IDBI Bank",
    "Yes Bank",
    "Bandhan Bank",
]


def _parse_date_string(dt_str: str) -> Optional[str]:
    """Parse various date formats into ISO YYYY-MM-DD string."""
    if not dt_str:
        return None
    dt_str = dt_str.strip()

    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d %b %Y",
        "%d %B %Y",
        "%B %d, %Y",
        "%b %d, %Y",
    ]
    for fmt in formats:
        try:
            parsed = datetime.strptime(dt_str, fmt)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def extract_fdr_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Read and parse FDR certificate PDF bytes.
    Extracts fdr_number, bank_name, amount, issue_date, maturity_date, and AICTE lien clause.
    """
    raw_text = ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                raw_text += t + "\n"
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to extract text from PDF: {str(e)}",
            "fdr_number": None,
            "bank_name": None,
            "amount": None,
            "issue_date": None,
            "maturity_date": None,
            "joint_lien_detected": False,
            "confidence": 0.0,
            "raw_text_preview": "",
        }

    # Normalize text
    text_clean = re.sub(r"[ \t]+", " ", raw_text)

    # ─────────────────────────────────────────────────────────────
    # 1. FDR Number Extraction
    # ─────────────────────────────────────────────────────────────
    fdr_number = None
    fdr_patterns = [
        r"\b(DEMO[-_ ]?FDR[-_ ][A-Z0-9\-_]+)\b",
        r"\b(FDR[-_ ][0-9]{4}[-_ ][A-Z0-9\-_]{4,20})\b",
        r"(?:FDR[-_ ]?NO\.?|RECEIPT[-_ ]?NO\.?|CERTIFICATE[-_ ]?NO\.?|FDR[-_ ]?NUMBER|DEPOSIT[-_ ]?NO\.?)[: #\t\n]*([A-Z0-9\/\-_]{6,30})",
        r"(?:A\/C[-_ ]?NO\.?|ACCOUNT[-_ ]?NO\.?)[: #\t\n]*([0-9]{9,18})",
        r"\b(FDR[A-Z0-9\-_]{6,25})\b",
    ]
    for pat in fdr_patterns:
        match = re.search(pat, text_clean, re.IGNORECASE)
        if match:
            fdr_number = match.group(1) if match.groups() else match.group(0)
            fdr_number = fdr_number.strip(" :#\t\n\r")
            break

    # ─────────────────────────────────────────────────────────────
    # 2. Bank Name Extraction
    # ─────────────────────────────────────────────────────────────
    bank_name = None
    for b in KNOWN_BANKS:
        if re.search(r"\b" + re.escape(b) + r"\b", text_clean, re.IGNORECASE):
            bank_name = b
            break

    # Generic bank pattern fallback if not in dictionary
    if not bank_name:
        bank_match = re.search(r"([A-Za-z\s]+Bank(?: of [A-Za-z]+)?)", text_clean, re.IGNORECASE)
        if bank_match:
            candidate = bank_match.group(1).strip()
            if len(candidate) < 50:
                bank_name = candidate

    # ─────────────────────────────────────────────────────────────
    # 3. Amount Extraction
    # ─────────────────────────────────────────────────────────────
    amount = None
    amount_patterns = [
        r"(?:Principal|Deposit|FDR|Fixed Deposit)?\s*(?:Amount|Sum of)[: #\t]*(?:INR|Rs\.?|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)",
        r"(?:INR|Rs\.?|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)",
        r"\bAmount[: #\t]*([0-9,]+(?:\.[0-9]{2})?)",
    ]
    for pat in amount_patterns:
        matches = re.finditer(pat, text_clean, re.IGNORECASE)
        candidates = []
        for m in matches:
            val_str = m.group(1).replace(",", "").strip()
            try:
                val = float(val_str)
                # Deposits for AICTE are usually at least 10,000 INR
                if val >= 10000:
                    candidates.append(val)
            except ValueError:
                continue
        if candidates:
            # Pick highest or first significant candidate
            amount = max(candidates)
            break

    # ─────────────────────────────────────────────────────────────
    # 4. Dates Extraction (Issue Date & Maturity Date)
    # ─────────────────────────────────────────────────────────────
    issue_date = None
    maturity_date = None

    date_regex = r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})"

    # Issue Date
    issue_pats = [
        r"(?:Issue Date|Date of Issue|Deposit Date|Effective Date|Value Date|Booking Date)[: #\t]*" + date_regex,
        r"(?:Issued on|Dated)[: #\t]*" + date_regex,
    ]
    for pat in issue_pats:
        m = re.search(pat, text_clean, re.IGNORECASE)
        if m:
            issue_date = _parse_date_string(m.group(1))
            if issue_date:
                break

    # Maturity Date
    maturity_pats = [
        r"(?:Maturity Date|Date of Maturity|Due Date|Expiry Date|Maturing on)[: #\t]*" + date_regex,
        r"(?:Repayable on|Expires on)[: #\t]*" + date_regex,
    ]
    for pat in maturity_pats:
        m = re.search(pat, text_clean, re.IGNORECASE)
        if m:
            maturity_date = _parse_date_string(m.group(1))
            if maturity_date:
                break

    # Fallback date pair search if not matched with labels
    if not issue_date or not maturity_date:
        all_dates = []
        for dm in re.finditer(date_regex, text_clean):
            parsed = _parse_date_string(dm.group(1))
            if parsed and parsed not in all_dates:
                all_dates.append(parsed)
        if len(all_dates) >= 2:
            sorted_dates = sorted(all_dates)
            if not issue_date:
                issue_date = sorted_dates[0]
            if not maturity_date:
                maturity_date = sorted_dates[-1]

    # ─────────────────────────────────────────────────────────────
    # 5. AICTE Joint Lien Detection
    # ─────────────────────────────────────────────────────────────
    joint_lien_detected = False
    lien_keywords = [
        "AICTE",
        "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
        "JOINT LIEN",
        "LIEN ENDORSED",
        "EARMARKED",
        "IN FAVOUR OF AICTE",
    ]
    for kw in lien_keywords:
        if kw in text_clean.upper():
            joint_lien_detected = True
            break

    # Calculate confidence
    fields = [fdr_number, bank_name, amount, issue_date, maturity_date]
    found_count = sum(1 for f in fields if f is not None)
    confidence = round(found_count / 5.0, 2)
    if joint_lien_detected and confidence >= 0.6:
        confidence = min(0.99, confidence + 0.1)

    return {
        "success": found_count >= 3,
        "fdr_number": fdr_number,
        "bank_name": bank_name,
        "amount": amount,
        "issue_date": issue_date,
        "maturity_date": maturity_date,
        "joint_lien_detected": joint_lien_detected,
        "confidence": confidence,
        "raw_text_preview": text_clean[:400].strip(),
    }


def generate_sample_fdr_pdf(
    fdr_number: str,
    bank_name: str,
    amount: float,
    issue_date: str,
    maturity_date: str,
    branch_name: str = "Main Branch, MG Road",
    college_name: str = "Alpha Institute of Technology",
    has_lien: bool = True,
) -> bytes:
    """
    Generate an authentic synthetic FDR certificate PDF using ReportLab.
    Used for seed data and live OCR validation.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    # Outer decorative border
    c.setStrokeColor(colors.HexColor("#1A365D"))
    c.setLineWidth(3)
    c.rect(36, 36, width - 72, height - 72)
    c.setLineWidth(1)
    c.rect(42, 42, width - 84, height - 84)

    # Header: Bank Name
    c.setFillColor(colors.HexColor("#1A365D"))
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, height - 80, bank_name.upper())

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawCentredString(width / 2, height - 98, f"Branch: {branch_name} | Core Banking System (CBS) Verified")

    # Title Banner
    c.setFillColor(colors.HexColor("#2B6CB0"))
    c.rect(50, height - 145, width - 100, 32, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 132, "TERM DEPOSIT / FIXED DEPOSIT RECEIPT")

    # Details Box
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)

    y = height - 190
    line_h = 24

    c.drawString(70, y, "FDR Certificate No.:")
    c.setFont("Helvetica", 11)
    c.drawString(240, y, fdr_number)

    y -= line_h
    c.setFont("Helvetica-Bold", 11)
    c.drawString(70, y, "Account Title / Holder:")
    c.setFont("Helvetica", 11)
    c.drawString(240, y, college_name)

    y -= line_h
    c.setFont("Helvetica-Bold", 11)
    c.drawString(70, y, "Principal Amount:")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(240, y, f"INR {amount:,.2f}")

    y -= line_h
    c.setFont("Helvetica-Bold", 11)
    c.drawString(70, y, "Date of Issue:")
    c.setFont("Helvetica", 11)
    c.drawString(240, y, str(issue_date))

    y -= line_h
    c.setFont("Helvetica-Bold", 11)
    c.drawString(70, y, "Date of Maturity:")
    c.setFont("Helvetica", 11)
    c.drawString(240, y, str(maturity_date))

    # Lien Endorsement Clause
    y -= 40
    if has_lien:
        c.setFillColor(colors.HexColor("#FFF5F5"))
        c.setStrokeColor(colors.HexColor("#C53030"))
        c.setLineWidth(1)
        c.rect(60, y - 40, width - 120, 50, fill=1, stroke=1)

        c.setFillColor(colors.HexColor("#9B2C2C"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(75, y - 5, "MANDATORY STATUTORY LIEN ENDORSEMENT:")
        c.setFont("Helvetica", 9)
        c.drawString(
            75, y - 22,
            "Deposit earmarked in joint name with Regional Officer / Member Secretary, AICTE."
        )
        c.drawString(
            75, y - 34,
            "Non-encashable without written release authority signed by AICTE authorized signatory."
        )
    else:
        c.setFillColor(colors.HexColor("#718096"))
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(70, y - 10, "Standard Deposit Receipt (No Joint Lien Clause Endorsed)")

    # Bank Seal and Signatures
    y = 120
    c.setFillColor(colors.HexColor("#2D3748"))
    c.setFont("Helvetica", 9)
    c.drawString(70, y, "Verified by Core Banking Network")
    c.drawString(70, y - 14, "Computer Generated Receipt — Validated Seal")

    c.drawRightString(width - 70, y, "For " + bank_name)
    c.drawRightString(width - 70, y - 28, "Authorized Bank Branch Officer")

    c.showPage()
    c.save()
    return buf.getvalue()
