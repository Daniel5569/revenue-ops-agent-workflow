import assert from "node:assert/strict";
import test from "node:test";

import { createIdempotencyKey } from "../src/lib/idempotency.mjs";
import { evaluatePolicy } from "../src/lib/policy.mjs";
import { createProposalFromEvent } from "../src/lib/proposals.mjs";
import { validateCrmEvent } from "../src/lib/validation.mjs";

const hotLeadEvent = {
  source: "hubspot-demo",
  externalRef: "lead_1001",
  eventType: "lead.created",
  occurredAt: "2026-06-12T09:30:00Z",
  payload: {
    accountName: "Northstar Analytics",
    domain: "northstar.example",
    segment: "b2b_saas",
    seniority: "vp",
    signals: ["pricing_page", "product_docs"]
  }
};

test("validates CRM events", () => {
  assert.equal(validateCrmEvent(hotLeadEvent).ok, true);
  assert.equal(validateCrmEvent({ ...hotLeadEvent, eventType: "unknown" }).ok, false);
});

test("idempotency key is stable regardless of payload key order", () => {
  const reordered = {
    ...hotLeadEvent,
    payload: {
      signals: ["pricing_page", "product_docs"],
      seniority: "vp",
      segment: "b2b_saas",
      domain: "northstar.example",
      accountName: "Northstar Analytics"
    }
  };

  assert.equal(createIdempotencyKey(hotLeadEvent), createIdempotencyKey(reordered));
});

test("policy blocks external sends and requires approval for owner reassignment", () => {
  assert.deepEqual(evaluatePolicy({ actionType: "send_external_email", idempotencyKey: "abc" }), {
    decision: "blocked",
    reasonCode: "BLOCKED_DESTRUCTIVE_OR_EXTERNAL"
  });
  assert.deepEqual(evaluatePolicy({ actionType: "reassign_owner", idempotencyKey: "abc" }), {
    decision: "requires_approval",
    reasonCode: "HUMAN_APPROVAL_REQUIRED"
  });
});

test("proposal creation maps hot inbound lead to approval-gated owner action", () => {
  const proposal = createProposalFromEvent(hotLeadEvent, createIdempotencyKey(hotLeadEvent));

  assert.equal(proposal.actionType, "reassign_owner");
  assert.equal(proposal.policyDecision, "requires_approval");
  assert.equal(proposal.reasonCode, "HOT_INBOUND_SLA");
  assert.equal(proposal.status, "pending");
  assert.ok(proposal.confidence >= 0.9);
});
