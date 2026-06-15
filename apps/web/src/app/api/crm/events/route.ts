import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validateCrmEvent } from "../../../../lib/validation.mjs";
import { createIdempotencyKey } from "../../../../lib/idempotency.mjs";
import { createProposalFromEvent } from "../../../../lib/proposals.mjs";
import { saveCrmEvent, saveProposal } from "../../../../lib/store.mjs";
import { enqueueCrmEvent, moveToDeadLetter } from "../../../../lib/queue.mjs";

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateCrmEvent(body);

  if (!validation.ok) {
    moveToDeadLetter(body, validation.errors.join("; "));
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const idempotencyKey = createIdempotencyKey(body);
  const event = { ...body, id: randomUUID(), idempotencyKey };
  const saved = saveCrmEvent(event);

  if (saved.duplicate) {
    return NextResponse.json(
      { id: saved.record.id, idempotencyKey, duplicate: true, status: "accepted" },
      { status: 202 }
    );
  }

  try {
    const job = enqueueCrmEvent(saved.record);
    const proposal = saveProposal(createProposalFromEvent(body, idempotencyKey));
    return NextResponse.json({ id: saved.record.id, idempotencyKey, jobId: job.id, proposalId: proposal.id }, { status: 202 });
  } catch (error) {
    moveToDeadLetter(saved.record, error instanceof Error ? error.message : "enqueue_failed");
    return NextResponse.json({ id: saved.record.id, status: "dead_letter" }, { status: 503 });
  }
}
