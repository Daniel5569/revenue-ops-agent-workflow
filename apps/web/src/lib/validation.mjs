const allowedEventTypes = new Set([
  "lead.created",
  "lead.updated",
  "opportunity.updated",
  "activity.logged",
  "policy.action_requested"
]);

export function validateCrmEvent(input) {
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["Event body must be an object."] };
  }

  for (const field of ["source", "externalRef", "eventType", "occurredAt"]) {
    if (typeof input[field] !== "string" || input[field].trim().length < 2) {
      errors.push(`${field} must be a non-empty string.`);
    }
  }

  if (!allowedEventTypes.has(input.eventType)) {
    errors.push("eventType is not supported.");
  }

  if (Number.isNaN(Date.parse(input.occurredAt))) {
    errors.push("occurredAt must be an ISO date string.");
  }

  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    errors.push("payload must be an object.");
  }

  return { ok: errors.length === 0, errors };
}
