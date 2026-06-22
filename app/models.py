from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class UploadedDocument(BaseModel):
    id: str
    filename: str
    content_type: str | None = None
    extracted_text: str
    preview: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UploadSession(BaseModel):
    id: str
    documents: list[UploadedDocument]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HiddenFee(BaseModel):
    label: str
    amount: float | None = None


class VendorExtraction(BaseModel):
    document_id: str
    source_filename: str
    vendor_name: str
    price: float | None = None
    currency: str = "USD"
    contract_length_months: int | None = None
    renewal: str | None = None
    penalty: str | None = None
    sla: str | None = None
    hidden_fees: list[HiddenFee] = Field(default_factory=list)
    extracted_fields: dict[str, Any] = Field(default_factory=dict)
    extraction_confidence: float = Field(ge=0, le=1, default=0.0)


class VendorScore(BaseModel):
    vendor_name: str
    total_cost: float | None
    score: int
    risk: str
    saving_vs_worst: float
    confidence: int
    reasons: list[str]
    breakdown: dict[str, int]


class Recommendation(BaseModel):
    winner: str
    score: int
    risk: str
    saving: str
    confidence: int
    why: list[str]
    rankings: list[VendorScore]


class AnalysisResult(BaseModel):
    id: str
    upload_id: str
    vendors: list[VendorExtraction]
    recommendation: Recommendation
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnalyzeRequest(BaseModel):
    upload_id: str
