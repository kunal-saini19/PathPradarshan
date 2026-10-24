import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedAdmin, readJsonBody } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({ status: z.enum(["ACCEPTED", "REJECTED"]), feedback: z.string().min(2).max(4000) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticatedAdmin(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const evidenceId = Number((await params).id);
  if (!Number.isInteger(evidenceId) || evidenceId <= 0) return NextResponse.json({ detail: "Invalid evidence" }, { status: 400 });
  const parsed = reviewSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Invalid evidence review", issues: parsed.error.flatten() }, { status: 400 });
  const evidence = await prisma.careerEvidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) return NextResponse.json({ detail: "Evidence not found" }, { status: 404 });
  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.careerEvidence.update({ where: { id: evidenceId }, data: { status: parsed.data.status } });
    await transaction.careerEvidenceReview.create({ data: { evidenceId, reviewerId: auth.user.id, status: parsed.data.status, feedback: parsed.data.feedback } });
    return updated;
  });
  return NextResponse.json({ evidence: result });
}