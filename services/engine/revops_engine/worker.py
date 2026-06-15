"""Small deterministic worker model.

The production adapter would consume Redis Streams and write PostgreSQL rows.
This module keeps the business logic testable without external services.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
from json import dumps
from typing import Any

from .policy import evaluate_action
from .scorer import confidence_from_score, score_record


@dataclass
class WorkerState:
    processed_keys: set[str] = field(default_factory=set)
    proposals: list[dict[str, Any]] = field(default_factory=list)
    dead_letter: list[dict[str, Any]] = field(default_factory=list)
    audit: list[dict[str, Any]] = field(default_factory=list)


def canonical_key(event: dict[str, Any]) -> str:
    body = {
        "source": event.get("source"),
        "externalRef": event.get("externalRef"),
        "eventType": event.get("eventType"),
        "payload": event.get("payload", {}),
    }
    return sha256(dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def infer_action_type(event: dict[str, Any]) -> str:
    payload = event.get("payload") or {}
    if payload.get("requestedAction") == "send_external_email":
        return "send_external_email"
    if payload.get("duplicateContact"):
        return "merge_contact"
    if event.get("eventType") == "opportunity.updated":
        return "create_follow_up_task"
    if str(payload.get("seniority", "")).lower() in {"vp", "cxo", "director"}:
        return "reassign_owner"
    return "create_follow_up_task"


def process_event(event: dict[str, Any], state: WorkerState | None = None) -> dict[str, Any]:
    state = state or WorkerState()
    payload = event.get("payload")

    if not isinstance(payload, dict):
        item = {"event": event, "reason": "INVALID_PAYLOAD"}
        state.dead_letter.append(item)
        return {"status": "dead_letter", "item": item}

    idempotency_key = event.get("idempotencyKey") or canonical_key(event)
    if idempotency_key in state.processed_keys:
        state.audit.append({"eventType": "event.duplicate_ignored", "idempotencyKey": idempotency_key})
        return {"status": "duplicate", "idempotencyKey": idempotency_key}

    score = score_record(payload)
    action_type = infer_action_type(event)
    policy = evaluate_action(action_type, idempotency_key=idempotency_key)
    proposal = {
        "id": f"proposal_{idempotency_key[:12]}",
        "actionType": action_type,
        "targetType": "opportunity" if event.get("eventType") == "opportunity.updated" else "lead",
        "targetId": payload.get("domain") or payload.get("opportunityId") or event.get("externalRef"),
        "reasonCode": score.reason_codes[0] if score.reason_codes else "REVOPS_REVIEW",
        "confidence": confidence_from_score(score.score),
        "status": "blocked" if policy.decision == "blocked" else "auto_safe" if policy.decision == "auto_safe" else "pending",
        "policyDecision": policy.decision,
        "payload": {
            "score": score.score,
            "reasonCodes": list(score.reason_codes),
            "policyReasonCode": policy.reason_code,
        },
    }

    state.processed_keys.add(idempotency_key)
    state.proposals.append(proposal)
    state.audit.append({"eventType": "proposal.created", "proposalId": proposal["id"]})
    return {"status": "processed", "proposal": proposal, "idempotencyKey": idempotency_key}


def reclaim_stale_pending(pending: list[dict[str, Any]], *, older_than_ms: int) -> list[dict[str, Any]]:
    return [job | {"reclaimed": True} for job in pending if job.get("idleMs", 0) >= older_than_ms]


if __name__ == "__main__":
    demo = {
        "source": "hubspot-demo",
        "externalRef": "lead_1001",
        "eventType": "lead.created",
        "payload": {
            "domain": "northstar.example",
            "segment": "b2b_saas",
            "seniority": "vp",
            "signals": ["pricing_page", "product_docs"],
        },
    }
    print(process_event(demo))
