from __future__ import annotations

import re

from app.models import Recommendation, VendorExtraction, VendorScore


WEIGHTS = {
    "cost": 0.35,
    "risk": 0.25,
    "flexibility": 0.20,
    "terms": 0.20,
}


def recommend(vendors: list[VendorExtraction]) -> Recommendation:
    if not vendors:
        raise ValueError("At least one vendor is required for analysis")

    totals = [_total_cost(vendor) for vendor in vendors]
    known_totals = [total for total in totals if total is not None]
    min_cost = min(known_totals) if known_totals else None
    max_cost = max(known_totals) if known_totals else None

    scored = [
        _score_vendor(vendor, min_cost=min_cost, max_cost=max_cost)
        for vendor in vendors
    ]
    scored.sort(key=lambda score: (score.score, -1 * (score.total_cost or 0)), reverse=True)

    winner = scored[0]
    worst_cost = max((score.total_cost or 0) for score in scored)
    for score in scored:
        score.saving_vs_worst = max(0.0, worst_cost - (score.total_cost or worst_cost))
    winner_cost = winner.total_cost or worst_cost
    saving = max(0.0, worst_cost - winner_cost)
    confidence = _recommendation_confidence(scored, vendors)

    return Recommendation(
        winner=winner.vendor_name,
        score=winner.score,
        risk=winner.risk,
        saving=_format_money(saving),
        confidence=confidence,
        why=winner.reasons,
        rankings=scored,
    )


def _score_vendor(vendor: VendorExtraction, min_cost: float | None, max_cost: float | None) -> VendorScore:
    cost_score = _cost_score(_total_cost(vendor), min_cost, max_cost)
    risk_score = _risk_score(vendor)
    flexibility_score = _flexibility_score(vendor)
    terms_score = _terms_score(vendor)

    weighted = (
        cost_score * WEIGHTS["cost"]
        + risk_score * WEIGHTS["risk"]
        + flexibility_score * WEIGHTS["flexibility"]
        + terms_score * WEIGHTS["terms"]
    )
    score = int(round(weighted))
    risk_label = _risk_label(risk_score)
    total_cost = _total_cost(vendor)
    reasons = _reasons(vendor, cost_score, risk_score, flexibility_score, terms_score)

    return VendorScore(
        vendor_name=vendor.vendor_name,
        total_cost=total_cost,
        score=score,
        risk=risk_label,
        saving_vs_worst=0.0,
        confidence=int(round(vendor.extraction_confidence * 100)),
        reasons=reasons,
        breakdown={
            "cost": int(round(cost_score)),
            "risk": int(round(risk_score)),
            "flexibility": int(round(flexibility_score)),
            "terms": int(round(terms_score)),
        },
    )


def _total_cost(vendor: VendorExtraction) -> float | None:
    if vendor.price is None:
        return None
    fee_total = sum(fee.amount or 0 for fee in vendor.hidden_fees)
    return vendor.price + fee_total


def _cost_score(total_cost: float | None, min_cost: float | None, max_cost: float | None) -> float:
    if total_cost is None:
        return 45
    if min_cost is None or max_cost is None or min_cost == max_cost:
        return 85
    spread = max_cost - min_cost
    return 60 + ((max_cost - total_cost) / spread) * 40


def _risk_score(vendor: VendorExtraction) -> float:
    score = 88.0
    renewal = (vendor.renewal or "").lower()
    penalty = (vendor.penalty or "").lower()
    sla = (vendor.sla or "").lower()

    if "auto" in renewal or "evergreen" in renewal:
        score -= 14
    if penalty:
        score -= 18
        if _first_money(penalty):
            score -= 6
    if vendor.hidden_fees:
        score -= min(18, 6 * len(vendor.hidden_fees))
    if sla:
        uptime = _sla_percent(sla)
        if uptime is not None and uptime < 99.5:
            score -= 10
        elif uptime is not None and uptime >= 99.9:
            score += 4
    else:
        score -= 8

    return _clamp(score)


def _flexibility_score(vendor: VendorExtraction) -> float:
    score = 82.0
    term = vendor.contract_length_months
    renewal = (vendor.renewal or "").lower()
    penalty = (vendor.penalty or "").lower()

    if term is None:
        score -= 8
    elif term <= 12:
        score += 10
    elif term <= 24:
        score -= 6
    else:
        score -= 16

    if "auto" in renewal or "evergreen" in renewal:
        score -= 12
    if "opt out" in renewal or "non-renew" in renewal or "30 days" in renewal:
        score += 5
    if penalty:
        score -= 12

    return _clamp(score)


def _terms_score(vendor: VendorExtraction) -> float:
    score = 78.0
    sla = (vendor.sla or "").lower()
    renewal = (vendor.renewal or "").lower()

    uptime = _sla_percent(sla)
    if uptime is None:
        score -= 8
    elif uptime >= 99.9:
        score += 12
    elif uptime >= 99.5:
        score += 5
    else:
        score -= 10

    if "net 30" in renewal or "mutual" in renewal:
        score += 4
    if vendor.hidden_fees:
        score -= min(12, 4 * len(vendor.hidden_fees))

    return _clamp(score)


def _risk_label(score: float) -> str:
    if score >= 75:
        return "Low"
    if score >= 55:
        return "Medium"
    return "High"


def _reasons(
    vendor: VendorExtraction,
    cost_score: float,
    risk_score: float,
    flexibility_score: float,
    terms_score: float,
) -> list[str]:
    reasons: list[str] = []

    if vendor.price is not None:
        reasons.append(f"All-in detected cost is {_format_money(_total_cost(vendor) or vendor.price)}.")
    if cost_score >= 90:
        reasons.append("Best relative cost among submitted vendors.")
    elif cost_score >= 75:
        reasons.append("Competitive price after visible fees.")
    if risk_score >= 75:
        reasons.append("Low risk profile based on penalties, renewal language, hidden fees, and SLA.")
    elif risk_score < 55:
        reasons.append("Risk remains elevated because the quote includes restrictive or unclear terms.")
    if flexibility_score >= 80:
        reasons.append("Flexible contract posture compared with longer or auto-renewing alternatives.")
    if terms_score >= 82:
        reasons.append("Favorable service terms, including the detected SLA language.")
    if vendor.hidden_fees:
        fee_names = ", ".join(fee.label for fee in vendor.hidden_fees)
        reasons.append(f"Visible extra fees were considered: {fee_names}.")

    return reasons[:5] or ["Best weighted score across cost, risk, flexibility, and terms."]


def _recommendation_confidence(scores: list[VendorScore], vendors: list[VendorExtraction]) -> int:
    extraction_confidence = sum(vendor.extraction_confidence for vendor in vendors) / len(vendors)
    margin = 0
    if len(scores) > 1:
        margin = max(0, scores[0].score - scores[1].score)
    confidence = 55 + extraction_confidence * 30 + min(margin, 15)
    return int(round(_clamp(confidence)))


def _sla_percent(text: str) -> float | None:
    match = re.search(r"([0-9]{2}(?:\.[0-9]+)?)\s*%", text)
    if not match:
        return None
    return float(match.group(1))


def _first_money(text: str) -> float | None:
    match = re.search(r"(?:\$|usd)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", text, flags=re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def _format_money(value: float) -> str:
    rounded = int(round(value))
    return f"${rounded:,}"


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))
