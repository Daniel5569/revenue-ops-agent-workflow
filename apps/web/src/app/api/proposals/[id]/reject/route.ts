import { NextResponse } from "next/server";
import { decideProposal } from "../../../../../lib/store.mjs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const proposal = decideProposal(id, "reject", body.reviewer ?? "demo.reviewer@example.com", body.reason ?? "Rejected by reviewer");

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json(proposal);
}
