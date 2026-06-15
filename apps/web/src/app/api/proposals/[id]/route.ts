import { NextResponse } from "next/server";
import { getProposal } from "../../../../lib/store.mjs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = getProposal(id);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json(proposal);
}
