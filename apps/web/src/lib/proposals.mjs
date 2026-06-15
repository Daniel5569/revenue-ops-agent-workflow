import { evaluatePolicy } from "./policy.mjs";

export function createProposalFromEvent(event, idempotencyKey) {
  const payload = event.payload ?? {};
  const actionType = inferActionType(event);
  const policy = evaluatePolicy({ actionType, idempotencyKey, payload });
  const targetId = payload.domain || payload.opportunityId || event.externalRef;

  return {
    id: `proposal_${idempotencyKey.slice(0, 12)}`,
    actionType,
    targetType: event.eventType.startsWith("opportunity") ? "opportunity" : "lead",
    targetId,
    reasonCode: inferReasonCode(event),
    confidence: inferConfidence(payload),
    status: policy.decision === "blocked" ? "blocked" : policy.decision === "auto_safe" ? "auto_safe" : "pending",
    policyDecision: policy.decision,
    payload: {
      accountName: payload.accountName ?? "Unknown account",
      evidence: inferEvidence(payload),
      policyReasonCode: policy.reasonCode
    }
  };
}

function inferActionType(event) {
  if (event.payload?.requestedAction === "send_external_email") return "send_external_email";
  if (event.payload?.duplicateContact) return "merge_contact";
  if (event.eventType === "opportunity.updated") return "create_follow_up_task";
  if (event.payload?.seniority && ["vp", "cxo", "director"].includes(String(event.payload.seniority).toLowerCase())) {
    return "reassign_owner";
  }
  return "create_follow_up_task";
}

function inferReasonCode(event) {
  if (event.payload?.requestedAction === "send_external_email") return "EXTERNAL_SEND_BLOCKED";
  if (event.payload?.duplicateContact) return "DUPLICATE_CONTACT_DOMAIN";
  if (event.payload?.daysSinceLastActivity >= 14) return "NO_ACTIVITY_14_DAYS";
  if (event.payload?.signals?.includes("pricing_page")) return "HOT_INBOUND_SLA";
  return "REVOPS_REVIEW";
}

function inferConfidence(payload) {
  let score = 0.52;
  if (payload.signals?.includes("pricing_page")) score += 0.19;
  if (payload.signals?.includes("product_docs")) score += 0.08;
  if (["vp", "cxo", "director"].includes(String(payload.seniority).toLowerCase())) score += 0.12;
  if (payload.segment === "b2b_saas") score += 0.07;
  return Math.min(0.98, Number(score.toFixed(2)));
}

function inferEvidence(payload) {
  const evidence = [];
  if (payload.segment) evidence.push(`Segment: ${payload.segment}`);
  if (payload.seniority) evidence.push(`Buyer seniority: ${payload.seniority}`);
  if (payload.signals?.length) evidence.push(`Signals: ${payload.signals.join(", ")}`);
  if (payload.daysSinceLastActivity) evidence.push(`No activity for ${payload.daysSinceLastActivity} days`);
  return evidence.length ? evidence : ["Payload accepted for deterministic review"];
}
