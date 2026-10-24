import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedLearner, readJsonBody } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const evidenceSchema = z.object({
  title: z.string().min(2).max(160),
  type: z.enum(["GITHUB", "LIVE_PROJECT", "PLATFORM_TASK", "PROJECT", "CERTIFICATE", "SCREENSHOT"]),
  skillName: z.string().min(1).max(80),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().max(4000).default(""),
  roadmapItemId: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const evidence = await prisma.careerEvidence.findMany({ where: { userId: auth.user.id }, include: { roadmapItem: { select: { title: true, skillName: true } }, reviews: { orderBy: { createdAt: "desc" } } }, orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ evidence });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const parsed = evidenceSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Invalid evidence", issues: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.roadmapItemId) {
    const item = await prisma.careerRoadmapItem.findFirst({ where: { id: parsed.data.roadmapItemId, roadmap: { profile: { userId: auth.user.id } } }, select: { id: true } });
    if (!item) return NextResponse.json({ detail: "Roadmap item not found" }, { status: 404 });
  }
  const evidence = await prisma.careerEvidence.create({ data: { userId: auth.user.id, roadmapItemId: parsed.data.roadmapItemId, title: parsed.data.title, type: parsed.data.type, skillName: parsed.data.skillName, url: parsed.data.url || null, description: parsed.data.description, status: "SUBMITTED" } });
  return NextResponse.json({ evidence }, { status: 201 });
}