import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { careerMentorFallback } from "@/lib/career-navigator";
import { authenticatedLearner, readJsonBody } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({ question: z.string().min(2).max(1200) });

export async function POST(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const parsed = questionSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Ask a specific career question", issues: parsed.error.flatten() }, { status: 400 });
  const profile = await prisma.careerProfile.findUnique({ where: { userId: auth.user.id }, include: { targetRole: true, assessments: { orderBy: { createdAt: "desc" }, take: 1 }, roadmaps: { where: { status: "ACTIVE" }, include: { items: { orderBy: { targetDate: "asc" }, take: 20 } }, take: 1 } } });
  if (!profile?.targetRole) return NextResponse.json({ detail: "Save a target role before using the mentor" }, { status: 409 });
  const storedGaps = profile.assessments[0]?.result && typeof profile.assessments[0].result === "object" && !Array.isArray(profile.assessments[0].result) ? (profile.assessments[0].result as { gaps?: Array<{ skillName: string; recommendedActivity: string }> }).gaps || [] : [];
  const answer = careerMentorFallback(parsed.data.question, { roleName: profile.targetRole.name, weeklyHours: profile.weeklyHours, gaps: storedGaps, activeItems: profile.roadmaps[0]?.items || [] });
  return NextResponse.json({ answer, mode: "deterministic-fallback", disclaimer: "This guidance uses saved profile data and is not a verified assessment or employment guarantee." });
}