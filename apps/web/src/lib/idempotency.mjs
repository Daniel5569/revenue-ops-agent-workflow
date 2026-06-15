import { createHash } from "node:crypto";

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function createIdempotencyKey(event) {
  const input = {
    source: event.source,
    externalRef: event.externalRef,
    eventType: event.eventType,
    payload: event.payload
  };

  return createHash("sha256").update(canonicalJson(input)).digest("hex");
}
