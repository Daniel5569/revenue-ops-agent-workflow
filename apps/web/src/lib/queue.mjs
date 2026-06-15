const stream = [];
const deadLetter = [];

export function enqueueCrmEvent(record) {
  if (record.payload?.forceEnqueueFailure) {
    throw new Error("Simulated enqueue failure");
  }

  const job = {
    id: `job_${stream.length + 1}`,
    eventId: record.id,
    idempotencyKey: record.idempotencyKey,
    status: "queued",
    createdAt: new Date().toISOString()
  };

  stream.push(job);
  return job;
}

export function moveToDeadLetter(record, reason) {
  const item = {
    id: `dlq_${deadLetter.length + 1}`,
    event: record,
    reason,
    createdAt: new Date().toISOString()
  };
  deadLetter.push(item);
  return item;
}

export function queueDepth() {
  return stream.length;
}
