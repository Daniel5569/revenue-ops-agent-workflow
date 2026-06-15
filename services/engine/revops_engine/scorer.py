"""Deterministic scoring rules for demo CRM events."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ScoreResult:
    score: int
    reason_codes: tuple[str, ...]


SENIORITY_WEIGHTS = {
    "cxo": 24,
    "vp": 20,
    "director": 14,
    "manager": 7,
}


def score_record(payload: dict[str, Any]) -> ScoreResult:
    score = 35
    reasons: list[str] = []

    if payload.get("segment") == "b2b_saas":
        score += 12
        reasons.append("TARGET_SEGMENT")

    seniority = str(payload.get("seniority", "")).lower()
    if seniority in SENIORITY_WEIGHTS:
        score += SENIORITY_WEIGHTS[seniority]
        reasons.append("SENIOR_BUYER")

    signals = set(payload.get("signals") or [])
    if "pricing_page" in signals:
        score += 18
        reasons.append("PRICING_INTENT")
    if "product_docs" in signals:
        score += 8
        reasons.append("PRODUCT_RESEARCH")

    if payload.get("daysSinceLastActivity", 0) >= 14:
        score += 10
        reasons.append("STALE_OPPORTUNITY")

    if payload.get("duplicateContact"):
        score -= 8
        reasons.append("DUPLICATE_REVIEW")

    return ScoreResult(score=max(0, min(score, 100)), reason_codes=tuple(reasons))


def confidence_from_score(score: int) -> float:
    return round(max(0.35, min(0.98, score / 100)), 2)
