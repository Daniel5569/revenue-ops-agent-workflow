const autoSafeActions = new Set(["create_follow_up_task", "add_internal_note"]);
const approvalRequiredActions = new Set([
  "draft_outbound_email",
  "move_opportunity_stage",
  "reassign_owner",
  "mark_churn_risk",
  "change_forecast_amount",
  "merge_contact"
]);
const blockedActions = new Set([
  "send_external_email",
  "delete_crm_record",
  "overwrite_closed_status",
  "update_without_idempotency_key"
]);

export function evaluatePolicy(action) {
  if (!action || typeof action !== "object") {
    return { decision: "blocked", reasonCode: "INVALID_ACTION" };
  }

  if (blockedActions.has(action.actionType)) {
    return { decision: "blocked", reasonCode: "BLOCKED_DESTRUCTIVE_OR_EXTERNAL" };
  }

  if (!action.idempotencyKey) {
    return { decision: "blocked", reasonCode: "MISSING_IDEMPOTENCY_KEY" };
  }

  if (approvalRequiredActions.has(action.actionType)) {
    return { decision: "requires_approval", reasonCode: "HUMAN_APPROVAL_REQUIRED" };
  }

  if (autoSafeActions.has(action.actionType)) {
    return { decision: "auto_safe", reasonCode: "INTERNAL_TASK_ONLY" };
  }

  return { decision: "requires_approval", reasonCode: "UNKNOWN_ACTION_REVIEW" };
}
