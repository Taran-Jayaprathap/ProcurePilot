from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from io import BytesIO
from statistics import mean
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader


app = FastAPI(
    title="ProcurePilot API",
    description="AI procurement intelligence API for document upload, extraction, and vendor recommendations.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadedDocument(BaseModel):
    id: str
    filename: str
    content_type: str | None = None
    text: str
    page_count: int
    character_count: int


class UploadResponse(BaseModel):
    id: str
    documents: list[UploadedDocument]
    status: str = "uploaded"
    created_at: str


class AnalyzeRequest(BaseModel):
    upload_id: str = Field(..., alias="uploadId")


class VendorExtraction(BaseModel):
    document_id: str
    document_name: str
    vendor_name: str
    price: float
    contract_length: str
    renewal_terms: str
    sla: str
    hidden_fees: list[str]
    penalties: list[str]
    cost_score: float
    risk_score: float
    flexibility_score: float
    terms_score: float
    total_score: float
    risk_level: str
    extraction_confidence: float


class DecisionResult(BaseModel):
    id: str
    upload_id: str
    recommended_vendor: str
    confidence_score: float
    risk_level: str
    savings_estimate: float
    executive_reasoning: str
    vendors: list[VendorExtraction]
    scoring_weights: dict[str, float]
    created_at: str


UPLOADS: dict[str, UploadResponse] = {}
RESULTS: dict[str, DecisionResult] = {}

SCORING_WEIGHTS = {
    "cost": 0.35,
    "risk": 0.25,
    "flexibility": 0.20,
    "terms": 0.20,
}

POSITIVE_SLA_TERMS = ("99.9", "99.95", "99.99", "uptime", "service credit", "response time")
RISK_TERMS = ("auto-renew", "automatic renewal", "termination fee", "penalty", "late fee", "minimum commitment")
HIDDEN_FEE_TERMS = ("implementation fee", "setup fee", "overage", "surcharge", "processing fee", "hidden fee")
FLEXIBLE_TERMS = ("month-to-month", "terminate for convenience", "no penalty", "30 days", "annual option")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload", response_model=UploadResponse)
async def upload(files: list[UploadFile] = File(...)) -> UploadResponse:
    if not files:
        raise HTTPException(status_code=400, detail="At least one PDF file is required.")

    documents: list[UploadedDocument] = []

    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Uploaded files must include filenames.")

        is_pdf = file.content_type == "application/pdf" or file.filename.lower().endswith(".pdf")
        if not is_pdf:
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF file.")

        raw = await file.read()
        text, page_count = extract_pdf_text(raw)
        if not text.strip():
            text = build_mock_text_from_filename(file.filename)

        documents.append(
            UploadedDocument(
                id=str(uuid.uuid4()),
                filename=file.filename,
                content_type=file.content_type,
                text=text,
                page_count=page_count,
                character_count=len(text),
            )
        )

    upload_response = UploadResponse(
        id=str(uuid.uuid4()),
        documents=documents,
        created_at=now_iso(),
    )
    UPLOADS[upload_response.id] = upload_response
    return upload_response


@app.post("/analyze", response_model=DecisionResult)
def analyze(request: AnalyzeRequest) -> DecisionResult:
    upload_response = UPLOADS.get(request.upload_id)
    if not upload_response:
        raise HTTPException(status_code=404, detail="Upload not found.")

    vendors = extract_vendors(upload_response.documents)
    if not vendors:
        raise HTTPException(status_code=422, detail="No vendor data could be extracted.")

    scored_vendors = score_vendors(vendors)
    ranked = sorted(scored_vendors, key=lambda vendor: vendor.total_score, reverse=True)
    recommended = ranked[0]
    prices = [vendor.price for vendor in ranked if vendor.price > 0]
    savings_estimate = estimate_savings(recommended.price, prices)
    confidence_score = calculate_confidence(ranked)

    result = DecisionResult(
        id=str(uuid.uuid4()),
        upload_id=upload_response.id,
        recommended_vendor=recommended.vendor_name,
        confidence_score=confidence_score,
        risk_level=recommended.risk_level,
        savings_estimate=savings_estimate,
        executive_reasoning=build_executive_reasoning(recommended, ranked, savings_estimate),
        vendors=ranked,
        scoring_weights=SCORING_WEIGHTS,
        created_at=now_iso(),
    )
    RESULTS[result.id] = result
    return result


@app.get("/result/{result_id}", response_model=DecisionResult)
def get_result(result_id: str) -> DecisionResult:
    result = RESULTS.get(result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found.")
    return result


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def extract_pdf_text(raw: bytes) -> tuple[str, int]:
    try:
        reader = PdfReader(BytesIO(raw))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(page.strip() for page in pages if page.strip())
        return text, len(reader.pages)
    except Exception as exc:  # pypdf raises several parser-specific exceptions.
        raise HTTPException(status_code=400, detail=f"Could not extract PDF text: {exc}") from exc


def build_mock_text_from_filename(filename: str) -> str:
    vendor = infer_vendor_from_filename(filename)
    return (
        f"Vendor Name: {vendor}\n"
        "Price: $125,000 annually\n"
        "Contract Length: 24 months\n"
        "Renewal Terms: Annual renewal with 60 days notice\n"
        "SLA: 99.9% uptime with service credits\n"
        "Hidden Fees: implementation fee and overage charges may apply\n"
        "Penalties: early termination fee applies\n"
    )


def extract_vendors(documents: list[UploadedDocument]) -> list[VendorExtraction]:
    return [extract_vendor(document) for document in documents]


def extract_vendor(document: UploadedDocument) -> VendorExtraction:
    text = normalize_text(document.text)
    lower_text = text.lower()
    vendor_name = extract_vendor_name(text, document.filename)
    price = extract_price(text)
    contract_length = extract_field(
        text,
        ["contract length", "term", "agreement length", "subscription term"],
        default="12 months",
    )
    renewal_terms = extract_field(
        text,
        ["renewal terms", "renewal", "auto renewal", "automatic renewal"],
        default="Manual renewal with standard notice",
    )
    sla = extract_field(
        text,
        ["sla", "service level agreement", "uptime", "support"],
        default="Standard support SLA",
    )
    hidden_fees = extract_terms(lower_text, HIDDEN_FEE_TERMS)
    penalties = extract_terms(lower_text, ("penalty", "termination fee", "late fee", "liquidated damages"))
    risk_level = calculate_risk_level(lower_text, hidden_fees, penalties)

    return VendorExtraction(
        document_id=document.id,
        document_name=document.filename,
        vendor_name=vendor_name,
        price=price,
        contract_length=contract_length,
        renewal_terms=renewal_terms,
        sla=sla,
        hidden_fees=hidden_fees or ["No material hidden fees detected"],
        penalties=penalties or ["No material penalties detected"],
        cost_score=0,
        risk_score=0,
        flexibility_score=0,
        terms_score=0,
        total_score=0,
        risk_level=risk_level,
        extraction_confidence=calculate_extraction_confidence(text, price),
    )


def score_vendors(vendors: list[VendorExtraction]) -> list[VendorExtraction]:
    prices = [vendor.price for vendor in vendors if vendor.price > 0]
    min_price = min(prices) if prices else 0
    max_price = max(prices) if prices else 0

    scored: list[VendorExtraction] = []
    for vendor in vendors:
        lower_blob = " ".join(
            [
                vendor.contract_length,
                vendor.renewal_terms,
                vendor.sla,
                " ".join(vendor.hidden_fees),
                " ".join(vendor.penalties),
            ]
        ).lower()
        cost_score = score_cost(vendor.price, min_price, max_price)
        risk_score = score_risk(vendor.risk_level, lower_blob)
        flexibility_score = score_flexibility(lower_blob)
        terms_score = score_terms(lower_blob)
        total_score = round(
            cost_score * SCORING_WEIGHTS["cost"]
            + risk_score * SCORING_WEIGHTS["risk"]
            + flexibility_score * SCORING_WEIGHTS["flexibility"]
            + terms_score * SCORING_WEIGHTS["terms"],
            1,
        )
        scored.append(
            vendor.model_copy(
                update={
                    "cost_score": cost_score,
                    "risk_score": risk_score,
                    "flexibility_score": flexibility_score,
                    "terms_score": terms_score,
                    "total_score": total_score,
                }
            )
        )
    return scored


def normalize_text(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text).strip()


def extract_vendor_name(text: str, filename: str) -> str:
    patterns = [
        r"(?:vendor|supplier|provider|company)\s*(?:name)?\s*[:\-]\s*([A-Za-z0-9 &.,'-]{2,80})",
        r"(?:proposal|quote)\s+(?:from|by)\s+([A-Za-z0-9 &.,'-]{2,80})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return clean_value(match.group(1))
    return infer_vendor_from_filename(filename)


def infer_vendor_from_filename(filename: str) -> str:
    stem = re.sub(r"\.pdf$", "", filename, flags=re.IGNORECASE)
    stem = re.sub(r"[_\-]+", " ", stem)
    stem = re.sub(r"\b(proposal|quote|contract|msa|sow|vendor)\b", "", stem, flags=re.IGNORECASE)
    cleaned = " ".join(stem.split()).strip()
    return cleaned.title() or "Unknown Vendor"


def extract_price(text: str) -> float:
    price_patterns = [
        r"(?:total|annual|subscription|contract)?\s*(?:price|cost|fees?)\s*[:\-]?\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)",
        r"\$\s*([0-9][0-9,]*(?:\.\d{2})?)",
    ]
    prices: list[float] = []
    for pattern in price_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            prices.append(float(match.group(1).replace(",", "")))
    return max(prices) if prices else 0


def extract_field(text: str, labels: list[str], default: str) -> str:
    for label in labels:
        pattern = rf"{re.escape(label)}\s*[:\-]\s*(.+?)(?:\n|\.|$)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return clean_value(match.group(1))
    return default


def clean_value(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" .:-")


def extract_terms(lower_text: str, terms: tuple[str, ...]) -> list[str]:
    found = []
    for term in terms:
        if term in lower_text:
            found.append(term.title())
    return found


def calculate_risk_level(lower_text: str, hidden_fees: list[str], penalties: list[str]) -> str:
    risk_count = sum(1 for term in RISK_TERMS if term in lower_text) + len(hidden_fees) + len(penalties)
    if risk_count >= 5:
        return "High"
    if risk_count >= 2:
        return "Medium"
    return "Low"


def calculate_extraction_confidence(text: str, price: float) -> float:
    signals = [
        "vendor" in text.lower() or "supplier" in text.lower(),
        price > 0,
        "sla" in text.lower() or "uptime" in text.lower(),
        "renewal" in text.lower(),
        "contract" in text.lower() or "term" in text.lower(),
    ]
    return round(0.55 + (sum(signals) / len(signals)) * 0.4, 2)


def score_cost(price: float, min_price: float, max_price: float) -> float:
    if price <= 0:
        return 55
    if min_price == max_price:
        return 85
    return round(100 - ((price - min_price) / (max_price - min_price)) * 45, 1)


def score_risk(risk_level: str, lower_blob: str) -> float:
    base_scores = {"Low": 92, "Medium": 74, "High": 48}
    score = base_scores.get(risk_level, 70)
    if "no material" in lower_blob:
        score += 4
    if "auto-renew" in lower_blob or "automatic renewal" in lower_blob:
        score -= 7
    return clamp_score(score)


def score_flexibility(lower_blob: str) -> float:
    score = 72
    score += sum(6 for term in FLEXIBLE_TERMS if term in lower_blob)
    score -= 10 if "early termination fee" in lower_blob or "termination fee" in lower_blob else 0
    score -= 8 if "minimum commitment" in lower_blob else 0
    return clamp_score(score)


def score_terms(lower_blob: str) -> float:
    score = 70
    score += sum(5 for term in POSITIVE_SLA_TERMS if term in lower_blob)
    score -= 6 if "overage" in lower_blob else 0
    score -= 6 if "setup fee" in lower_blob or "implementation fee" in lower_blob else 0
    return clamp_score(score)


def clamp_score(score: float) -> float:
    return round(max(0, min(100, score)), 1)


def estimate_savings(recommended_price: float, prices: list[float]) -> float:
    if recommended_price <= 0 or len(prices) < 2:
        return 0
    more_expensive_prices = [price for price in prices if price > recommended_price]
    if not more_expensive_prices:
        return 0
    return round(mean(more_expensive_prices) - recommended_price, 2)


def calculate_confidence(ranked_vendors: list[VendorExtraction]) -> float:
    if not ranked_vendors:
        return 0
    top = ranked_vendors[0]
    runner_up = ranked_vendors[1] if len(ranked_vendors) > 1 else None
    gap = top.total_score - runner_up.total_score if runner_up else 12
    confidence = 0.72 + min(gap, 20) / 100
    confidence *= top.extraction_confidence
    return round(min(confidence, 0.97), 2)


def build_executive_reasoning(
    recommended: VendorExtraction,
    ranked: list[VendorExtraction],
    savings_estimate: float,
) -> str:
    comparison = ""
    if len(ranked) > 1:
        comparison = f" It outscored the next best option by {recommended.total_score - ranked[1].total_score:.1f} points."
    savings = (
        f" Estimated savings are ${savings_estimate:,.0f} versus higher-priced alternatives."
        if savings_estimate > 0
        else " Savings are not the primary driver; the recommendation is based on balanced cost, risk, flexibility, and terms."
    )
    return (
        f"{recommended.vendor_name} is recommended because it produced the strongest weighted score "
        f"({recommended.total_score}/100) across cost, contractual risk, flexibility, and commercial terms."
        f"{comparison}{savings} Risk level is {recommended.risk_level.lower()}, with notable terms: "
        f"{recommended.renewal_terms}; {recommended.sla}."
    )
