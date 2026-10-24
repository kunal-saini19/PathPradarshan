import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateSkillGaps, generateRoadmap, normalizeSkills, rescheduleRoadmap } from "@/lib/career-navigator";
import { authenticatedLearner, readJsonBody, toRoleFramework } from "@/lib/career-navigator-db";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({ action: z.enum(["GENERATE", "REPLAN"]).default("GENERATE"), reason: z.string().max(500).optional(), expectedRevisionToken: z.number().int().positive().optional() });

export async function GET(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const roadmap = await prisma.careerRoadmap.findFirst({ where: { profile: { userId: auth.user.id }, status: "ACTIVE" }, include: { role: true, items: { orderBy: [{ targetDate: "asc" }, { id: "asc" }] }, progressEvents: { orderBy: { createdAt: "desc" }, take: 20 } } });
  return NextResponse.json({ roadmap });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedLearner(request);
  if ("error" in auth) return NextResponse.json({ detail: auth.error }, { status: auth.status });
  const parsed = requestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ detail: "Invalid roadmap request", issues: parsed.error.flatten() }, { status: 400 });
  const profile = await prisma.careerProfile.findUnique({ where: { userId: auth.user.id }, include: { targetRole: { include: { skills: true } }, assessments: { orderBy: { createdAt: "desc" }, take: 1 }, roadmaps: { where: { status: "ACTIVE" }, include: { items: true }, take: 1 } } });
  if (!profile?.targetRole) return NextResponse.json({ detail: "Save a target role before creating a roadmap" }, { status: 409 });

  const current = profile.roadmaps[0];
  if (parsed.data.action === "REPLAN") {
    if (!current) return NextResponse.json({ detail: "Create a roadmap before replanning" }, { status: 409 });
    if (parsed.data.expectedRevisionToken && parsed.data.expectedRevisionToken !== current.revisionToken) return NextResponse.json({ detail: "Roadmap changed since it was loaded; refresh before replanning" }, { status: 409 });
    const planItems = current.items.map((item) => ({ ...item, key: item.skillName.toLowerCase(), prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites.filter((value): value is string => typeof value === "string") : [], targetDate: item.targetDate, status: item.status as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" }));
    const scheduled = rescheduleRoadmap(planItems, profile.weeklyHours);
    try {
      await prisma.$transaction(async (transaction) => {
        const updated = await transaction.careerRoadmap.updateMany({ where: { id: current.id, revisionToken: current.revisionToken }, data: { weeklyHours: profile.weeklyHours, revision: { increment: 1 }, revisionToken: { increment: 1 }, changeReason: parsed.data.reason || `Replanned for ${profile.weeklyHours} hours per week` } });
        if (updated.count !== 1) throw new Error("ROADMAP_CONFLICT");
        for (const item of scheduled) if (item.status !== "COMPLETED") await transaction.careerRoadmapItem.update({ where: { id: item.id }, data: { targetDate: item.targetDate } });
        await transaction.careerProgressEvent.create({ data: { userId: auth.user.id, roadmapId: current.id, eventType: "ROADMAP_REPLANNED", details: { weeklyHours: profile.weeklyHours, reason: parsed.data.reason || "Availability changed" } } });
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error instanceof Error && error.message === "ROADMAP_CONFLICT") return NextResponse.json({ detail: "Roadmap changed concurrently; refresh and retry" }, { status: 409 });
      throw error;
    }
  } else {
    const framework = toRoleFramework(profile.targetRole);
    const gaps = calculateSkillGaps(normalizeSkills(profile.skills), framework);
    const completedSkills = new Set((current?.items || []).filter((item) => item.status === "COMPLETED").map((item) => item.skillName.toLowerCase()));
    const generated = generateRoadmap(gaps, framework, profile.weeklyHours, profile.targetDate, new Date(), completedSkills);
    const preserved = (current?.items || []).filter((item) => item.status === "COMPLETED").map((item) => ({ taskId: item.taskId, stage: item.stage, title: item.title, objective: item.objective, skillName: item.skillName, whyNeeded: item.whyNeeded, taskDescription: item.taskDescription, effortHours: item.effortHours, prerequisites: item.prerequisites, acceptanceCriteria: item.acceptanceCriteria, evidenceRequired: item.evidenceRequired, status: item.status, blockedReason: item.blockedReason, targetDate: item.targetDate }));
    const roadmapItems = [...preserved, ...generated.items].map((item) => ({
      taskId: "taskId" in item ? item.taskId : null,
      stage: item.stage,
      title: item.title,
      objective: item.objective,
      skillName: item.skillName,
      whyNeeded: item.whyNeeded,
      taskDescription: item.taskDescription,
      effortHours: item.effortHours,
      prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites.filter((value): value is string => typeof value === "string") : [],
      acceptanceCriteria: item.acceptanceCriteria,
      evidenceRequired: item.evidenceRequired,
      status: item.status,
      blockedReason: "blockedReason" in item ? item.blockedReason : null,
      targetDate: item.targetDate,
    }));
    try {
      await prisma.$transaction(async (transaction) => {
        if (current) await transaction.careerRoadmap.update({ where: { id: current.id }, data: { status: "ARCHIVED", activeKey: null } });
        const roadmap = await transaction.careerRoadmap.create({ data: { profileId: profile.id, roleId: profile.targetRole!.id, assessmentId: profile.assessments[0]?.id, activeKey: String(profile.id), revision: (current?.revision || 0) + 1, weeklyHours: profile.weeklyHours, targetDate: profile.targetDate, changeReason: current ? "Roadmap regenerated from updated profile or assessment" : "Initial roadmap generated", items: { create: roadmapItems } } });
        await transaction.careerProgressEvent.create({ data: { userId: auth.user.id, roadmapId: roadmap.id, eventType: current ? "ROADMAP_REGENERATED" : "ROADMAP_CREATED", details: { frameworkVersion: framework.version, preservedCompletedItems: preserved.length, warnings: generated.warnings } } });
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error instanceof Error && (error.message.includes("Unique constraint") || error.message.includes("P2034"))) return NextResponse.json({ detail: "Roadmap changed concurrently; refresh and retry" }, { status: 409 });
      throw error;
    }
  }
  const roadmap = await prisma.careerRoadmap.findFirst({ where: { profile: { userId: auth.user.id }, status: "ACTIVE" }, include: { role: true, items: { orderBy: [{ targetDate: "asc" }, { id: "asc" }] }, progressEvents: { orderBy: { createdAt: "desc" }, take: 20 } } });
  return NextResponse.json({ roadmap });
}