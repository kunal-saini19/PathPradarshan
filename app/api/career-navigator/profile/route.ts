import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateSkillGaps, normalizeSkills } from "@/lib/career-navigator";
import { authenticatedLearner, ensureCareerFrameworks, readJsonBody, toRoleFramework } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  roleSlug: z.string().min(1).max(80),
  background: z.string().max(4000).default(""),
  skills: z.array(z.object({ name: z.string().min(1).max(80), level: z.number().int().min(0).max(5), source: z.enum(["SELF_REPORTED", "TASK_EVIDENCE", "REVIEWED_EVIDENCE"]).default("SELF_REPORTED") })).max(50),
  interests: z.string().max(2000).default(""),
  previousProjects: z.array(z.object({ title: z.string().min(1).max(160), description: z.string().max(2000).default(""), url: z.string().url().optional().or(z.literal("")) })).max(25).default([]),
  careerStage: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  weeklyHours: z.number().int().min(1).max(80).default(6),
  targetDate: z.string().datetime().nullable().default(null),
  learningPreferences: z.string().max(1000).default(""),
});

export async function GET(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const profile = await prisma.careerProfile.findUnique({ where: { userId: auth.user.id }, include: { targetRole: { include: { skills: true } }, assessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const latestResult = profile?.assessments[0]?.result;
  const gaps = latestResult && typeof latestResult === "object" && !Array.isArray(latestResult) && "gaps" in latestResult ? latestResult.gaps : [];
  return NextResponse.json({ profile: profile ? { ...profile, gaps } : null });
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const parsed = profileSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Invalid career profile", issues: parsed.error.flatten() }, { status: 400 });

  const roles = await ensureCareerFrameworks();
  const role = roles.find((candidate) => candidate.slug === parsed.data.roleSlug);
  if (!role) return NextResponse.json({ detail: "Unsupported career role" }, { status: 400 });
  const normalizedSkills = normalizeSkills(parsed.data.skills);
  const framework = toRoleFramework(role);
  const gaps = calculateSkillGaps(normalizedSkills, framework);

  const profile = await prisma.$transaction(async (transaction) => {
    const saved = await transaction.careerProfile.upsert({
      where: { userId: auth.user.id },
      update: { targetRoleId: role.id, background: parsed.data.background, skills: parsed.data.skills, interests: parsed.data.interests, previousProjects: parsed.data.previousProjects, careerStage: parsed.data.careerStage, weeklyHours: parsed.data.weeklyHours, targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null, learningPreferences: parsed.data.learningPreferences },
      create: { userId: auth.user.id, targetRoleId: role.id, background: parsed.data.background, skills: parsed.data.skills, interests: parsed.data.interests, previousProjects: parsed.data.previousProjects, careerStage: parsed.data.careerStage, weeklyHours: parsed.data.weeklyHours, targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null, learningPreferences: parsed.data.learningPreferences },
    });
    await transaction.careerSkillAssessment.create({ data: { profileId: saved.id, roleId: role.id, frameworkVersion: role.version, result: { gaps, generatedAt: new Date().toISOString() } } });
    return saved;
  });
  const result = await prisma.careerProfile.findUnique({ where: { id: profile.id }, include: { targetRole: { include: { skills: true } }, assessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return NextResponse.json({ profile: result ? { ...result, gaps } : null, gaps, frameworkVersion: role.version });
}