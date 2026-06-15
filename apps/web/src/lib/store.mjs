const state = {
  events: new Map(),
  proposals: new Map(),
  audit: []
};

export function saveCrmEvent(event) {
  if (state.events.has(event.idempotencyKey)) {
    return { duplicate: true, record: state.events.get(event.idempotencyKey) };
  }

  const record = {
    id: event.id,
    source: event.source,
    externalRef: event.externalRef,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    payload: event.payload,
    idempotencyKey: event.idempotencyKey,
    status: "accepted"
  };

  state.events.set(event.idempotencyKey, record);
  appendAudit("crm_event", record.id, "event.accepted", { externalRef: record.externalRef });
  return { duplicate: false, record };
}

export function saveProposal(proposal) {
  state.proposals.set(proposal.id, proposal);
  appendAudit("proposed_action", proposal.id, "proposal.created", {
    actionType: proposal.actionType,
    policyDecision: proposal.policyDecision
  });
  return proposal;
}

export function getProposal(id) {
  return state.proposals.get(id) ?? null;
}

export function decideProposal(id, decision, reviewer, reason = "") {
  const proposal = getProposal(id);
  if (!proposal) return null;
  const status = decision === "approve" ? "approved" : "rejected";
  const updated = { ...proposal, status };
  state.proposals.set(id, updated);
  appendAudit("proposed_action", id, `proposal.${status}`, { reviewer, reason });
  return updated;
}

export function appendAudit(entityType, entityId, eventType, payload) {
  state.audit.push({
    entityType,
    entityId,
    eventType,
    payload,
    createdAt: new Date().toISOString()
  });
}

export function resetStoreForTests() {
  state.events.clear();
  state.proposals.clear();
  state.audit.length = 0;
}
