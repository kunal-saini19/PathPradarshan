import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canTransitionRoadmapItem } from "@/lib/career-navigator";
import { authenticatedLearner, readJsonBody } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"]), blockedReason: z.string().max(500).optional(), expectedRevisionToken: z.number().int().positive() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const itemId = Number((await params).id);
  if (!Number.isInteger(itemId) || itemId <= 0) return NextResponse.json({ detail: "Invalid roadmap item" }, { status: 400 });
  const parsed = updateSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Invalid roadmap item update", issues: parsed.error.flatten() }, { status: 400 });
  const item = await prisma.careerRoadmapItem.findFirst({ where: { id: itemId, roadmap: { profile: { userId: auth.user.id }, status: "ACTIVE" } }, include: { roadmap: true } });
  if (!item) return NextResponse.json({ detail: "Roadmap item not found" }, { status: 404 });
  if (!canTransitionRoadmapItem(item.status as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED", parsed.data.status)) return NextResponse.json({ detail: `Cannot transition ${item.status} to ${parsed.data.status}` }, { status: 409 });
  if (parsed.data.status === "BLOCKED" && !parsed.data.blockedReason?.trim()) return NextResponse.json({ detail: "A blocked item requires a reason" }, { status: 400 });
  if (parsed.data.status === "COMPLETED") {
    const evidence = await prisma.careerEvidence.count({ where: { roadmapItemId: item.id, userId: auth.user.id } });
    if (evidence === 0) return NextResponse.json({ detail: "Submit evidence before completing this item" }, { status: 409 });
  }
  const updated = await prisma.$transaction(async (transaction) => {
    const roadmapUpdate = await transaction.careerRoadmap.updateMany({ where: { id: item.roadmapId, revisionToken: parsed.data.expectedRevisionToken }, data: { revisionToken: { increment: 1 } } });
    if (roadmapUpdate.count !== 1) throw new Error("ROADMAP_CONFLICT");
    const saved = await transaction.careerRoadmapItem.update({ where: { id: item.id }, data: { status: parsed.data.status, blockedReason: parsed.data.status === "BLOCKED" ? parsed.data.blockedReason?.trim() : null } });
    await transaction.careerProgressEvent.create({ data: { userId: auth.user.id, roadmapId: item.roadmapId, itemId: item.id, eventType: "ROADMAP_ITEM_STATUS_CHANGED", details: { from: item.status, to: parsed.data.status } } });
    return saved;
  }).catch((error) => {
    if (error instanceof Error && error.message === "ROADMAP_CONFLICT") return null;
    throw error;
  });
  if (!updated) return NextResponse.json({ detail: "Roadmap changed concurrently; refresh and retry" }, { status: 409 });
  return NextResponse.json({ item: updated });
}