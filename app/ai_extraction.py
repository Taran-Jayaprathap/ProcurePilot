from __future__ import annotations

import re
from dataclasses import dataclass

from app.models import HiddenFee, UploadedDocument, VendorExtraction


PRICE_PATTERNS = (
    r"(?:total|quote|quoted|price|subscription|annual|amount|cost)\s*(?:price|cost|fee|amount)?\s*[:\-]?\s*(\$|usd)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)",
    r"(\$|usd)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)",
)

VENDOR_PATTERNS = (
    r"(?:vendor|supplier|provider|company)\s*(?:name)?\s*[:\-]\s*([A-Z][A-Za-z0-9&.,' \-]{1,80})",
    r"from\s*:\s*([^<\n]+)",
    r"(?:quote|proposal)\s+from\s+([A-Z][A-Za-z0-9&.,' \-]{1,80})",
)

HIDDEN_FEE_KEYWORDS = (
    "setup",
    "implementation",
    "onboarding",
    "training",
    "support",
    "integration",
    "migration",
    "overage",
    "processing",
    "service",
)


@dataclass(frozen=True)
class MatchedField:
    value: str | None
    source: str | None = None


def extract_vendor_quote(document: UploadedDocument) -> VendorExtraction:
    text = document.extracted_text
    vendor = _extract_vendor(text) or _vendor_from_filename(document.filename)
    price = _extract_price(text)
    contract_length = _extract_contract_length(text)
    renewal = _extract_renewal(text)
    penalty = _extract_penalty(text)
    sla = _extract_sla(text)
    hidden_fees = _extract_hidden_fees(text)

    extracted_fields = {
        "vendor_name": vendor,
        "price": price,
        "contract_length_months": contract_length,
        "renewal": renewal,
        "penalty": penalty,
        "sla": sla,
        "hidden_fees": [fee.model_dump() for fee in hidden_fees],
    }

    confidence = _confidence_score(extracted_fields)
    return VendorExtraction(
        document_id=document.id,
        source_filename=document.filename,
        vendor_name=vendor,
        price=price,
        contract_length_months=contract_length,
        renewal=renewal,
        penalty=penalty,
        sla=sla,
        hidden_fees=hidden_fees,
        extracted_fields=extracted_fields,
        extraction_confidence=confidence,
    )


def _extract_vendor(text: str) -> str | None:
    for pattern in VENDOR_PATTERNS:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _clean_vendor(match.group(1))
    first_line = next((line for line in text.splitlines() if line.strip()), "")
    if re.search(r"\b(quote|proposal|quotation)\b", first_line, flags=re.IGNORECASE):
        return _clean_vendor(re.sub(r"\b(quote|proposal|quotation)\b", "", first_line, flags=re.IGNORECASE))
    return None


def _clean_vendor(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = re.split(r"\s{2,}|\||,?\s+(?:quote|proposal|quotation|sales)\b", value, maxsplit=1, flags=re.IGNORECASE)[0]
    return value.strip(" .,-")[:80] or "Unknown Vendor"


def _vendor_from_filename(filename: str) -> str:
    name = re.sub(r"\.[A-Za-z0-9]+$", "", filename or "")
    name = re.sub(r"[_\-]+", " ", name).strip()
    return name.title() if name else "Unknown Vendor"


def _extract_price(text: str) -> float | None:
    lowered = text.lower()
    candidates: list[tuple[float, int]] = []

    for pattern in PRICE_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            amount = _parse_money(match.group(2))
            if amount is None:
                continue
            context = lowered[max(0, match.start() - 45) : match.end() + 45]
            weight = 3 if any(word in context for word in ("total", "annual", "quote", "contract")) else 1
            weight -= 2 if any(word in context for word in ("penalty", "termination", "setup", "implementation", "training")) else 0
            candidates.append((amount, weight))

    if not candidates:
        return None
    candidates.sort(key=lambda candidate: (candidate[1], candidate[0]), reverse=True)
    return candidates[0][0]


def _extract_contract_length(text: str) -> int | None:
    patterns = (
        r"(?:contract|term|length|commitment)\s*(?:length|term)?\s*[:\-]?\s*(\d{1,3})\s*(month|months|mo|year|years|yr|yrs)",
        r"(\d{1,3})\s*(month|months|mo|year|years|yr|yrs)\s+(?:contract|term|commitment)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        value = int(match.group(1))
        unit = match.group(2).lower()
        return value * 12 if unit.startswith(("year", "yr")) else value
    return None


def _extract_renewal(text: str) -> str | None:
    sentences = _sentences(text)
    for sentence in sentences:
        if re.search(r"\b(auto[\-\s]?renew|renewal|renews|evergreen)\b", sentence, flags=re.IGNORECASE):
            return sentence
    return None


def _extract_penalty(text: str) -> str | None:
    sentences = _sentences(text)
    for sentence in sentences:
        if re.search(r"\b(penalty|termination fee|cancellation fee|early termination|liquidated damages)\b", sentence, flags=re.IGNORECASE):
            if re.search(r"\b(no|none|without|waived)\b", sentence, flags=re.IGNORECASE):
                continue
            return sentence
    return None


def _extract_sla(text: str) -> str | None:
    sentences = _sentences(text)
    for sentence in sentences:
        if re.search(r"\b(sla|uptime|service level|response time|availability)\b", sentence, flags=re.IGNORECASE):
            return sentence
    return None


def _extract_hidden_fees(text: str) -> list[HiddenFee]:
    fees: list[HiddenFee] = []
    seen: set[str] = set()

    for sentence in _sentences(text):
        lower = sentence.lower()
        if "included" in lower or "no hidden" in lower or "no additional" in lower:
            continue
        if not any(keyword in lower for keyword in HIDDEN_FEE_KEYWORDS):
            continue
        if "fee" not in lower and "charge" not in lower and "$" not in sentence and "usd" not in lower:
            continue

        amount = _first_money(sentence)
        label = _fee_label(sentence)
        key = f"{label}:{amount}"
        if key in seen:
            continue
        seen.add(key)
        fees.append(HiddenFee(label=label, amount=amount))

    return fees


def _fee_label(sentence: str) -> str:
    lower = sentence.lower()
    for keyword in HIDDEN_FEE_KEYWORDS:
        if keyword in lower:
            return f"{keyword.title()} fee"
    return "Additional fee"


def _first_money(text: str) -> float | None:
    match = re.search(r"(?:\$|usd)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", text, flags=re.IGNORECASE)
    return _parse_money(match.group(1)) if match else None


def _parse_money(value: str) -> float | None:
    try:
        return float(value.replace(",", ""))
    except (TypeError, ValueError):
        return None


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|[\n\r;]+", text)
    return [
        re.sub(r"\s+", " ", part).strip(" .")
        for part in parts
        if part.strip()
    ]


def _confidence_score(fields: dict[str, object]) -> float:
    weighted_fields = {
        "vendor_name": 0.2,
        "price": 0.25,
        "contract_length_months": 0.15,
        "renewal": 0.1,
        "penalty": 0.1,
        "sla": 0.1,
        "hidden_fees": 0.1,
    }
    score = 0.0
    for field, weight in weighted_fields.items():
        value = fields[field]
        if field == "hidden_fees":
            score += weight
        elif value:
            score += weight
    return round(min(score, 1.0), 2)
