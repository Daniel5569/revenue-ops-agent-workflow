"""Approval policy for CRM proposed actions."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PolicyDecision:
    decision: str
    reason_code: str


AUTO_SAFE = {"create_follow_up_task", "add_internal_note"}
REQUIRES_APPROVAL = {
    "draft_outbound_email",
    "move_opportunity_stage",
    "reassign_owner",
    "mark_churn_risk",
    "change_forecast_amount",
    "merge_contact",
}
BLOCKED = {
    "send_external_email",
    "delete_crm_record",
    "overwrite_closed_status",
    "update_without_idempotency_key",
}


def evaluate_action(action_type: str, *, idempotency_key: str | None) -> PolicyDecision:
    if action_type in BLOCKED:
        return PolicyDecision("blocked", "BLOCKED_DESTRUCTIVE_OR_EXTERNAL")
    if not idempotency_key:
        return PolicyDecision("blocked", "MISSING_IDEMPOTENCY_KEY")
    if action_type in AUTO_SAFE:
        return PolicyDecision("auto_safe", "INTERNAL_TASK_ONLY")
    if action_type in REQUIRES_APPROVAL:
        return PolicyDecision("requires_approval", "HUMAN_APPROVAL_REQUIRED")
    return PolicyDecision("requires_approval", "UNKNOWN_ACTION_REVIEW")
