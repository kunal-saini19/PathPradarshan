import { prisma } from "@/lib/prisma";
import { roleFrameworks, type RoleFramework } from "@/lib/career-navigator";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function toRoleFramework(role: { slug: string; version: number; name: string; summary: string; rationale: string; sourceNote: string; skills: Array<{ skillName: string; requiredLevel: number; importance: number; prerequisites: unknown; tools: unknown; projectIdeas: unknown; evidence: string; rationale: string }> }): RoleFramework {
  return {
    slug: role.slug,
    version: role.version,
    name: role.name,
    summary: role.summary,
    rationale: role.rationale,
    sourceNote: role.sourceNote,
    skills: role.skills.map((skill) => ({
      name: skill.skillName,
      requiredLevel: Math.max(0, Math.min(5, skill.requiredLevel)) as 0 | 1 | 2 | 3 | 4 | 5,
      importance: Math.max(1, Math.min(5, skill.importance)) as 1 | 2 | 3 | 4 | 5,
      prerequisites: stringArray(skill.prerequisites),
      tools: stringArray(skill.tools),
      projectIdeas: stringArray(skill.projectIdeas),
      evidence: skill.evidence,
      rationale: skill.rationale,
    })),
  };
}

export async function ensureCareerFrameworks() {
  for (const definition of roleFrameworks) {
    const role = await prisma.careerRoleFramework.upsert({
      where: { slug_version: { slug: definition.slug, version: definition.version } },
      update: { name: definition.name, summary: definition.summary, rationale: definition.rationale, sourceNote: definition.sourceNote, isActive: true },
      create: { slug: definition.slug, version: definition.version, name: definition.name, summary: definition.summary, rationale: definition.rationale, sourceNote: definition.sourceNote, isActive: true },
    });
    for (const skill of definition.skills) {
      await prisma.careerRoleSkill.upsert({
        where: { roleId_skillName: { roleId: role.id, skillName: skill.name } },
        update: { requiredLevel: skill.requiredLevel, importance: skill.importance, prerequisites: skill.prerequisites, tools: skill.tools, projectIdeas: skill.projectIdeas, evidence: skill.evidence, rationale: skill.rationale },
        create: { roleId: role.id, skillName: skill.name, requiredLevel: skill.requiredLevel, importance: skill.importance, prerequisites: skill.prerequisites, tools: skill.tools, projectIdeas: skill.projectIdeas, evidence: skill.evidence, rationale: skill.rationale },
      });
    }
  }
  return prisma.careerRoleFramework.findMany({ where: { isActive: true }, include: { skills: true }, orderBy: [{ slug: "asc" }, { version: "desc" }] });
}

export async function requireLearner(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, emailVerified: true } });
  if (!user) return { error: "User not found", status: 404 as const };
  if (!user.emailVerified) return { error: "Email verification is required", status: 403 as const };
  if (user.role !== "FREELANCER") return { error: "Career Navigator requires a freelancer account", status: 403 as const };
  return { user };
}

export async function authenticatedLearner(request: Request) {
  const authenticated = await authenticatedUser(request);
  if ("error" in authenticated) return authenticated;
  if (authenticated.user.role !== "FREELANCER") return { error: "Career Navigator requires a freelancer account", status: 403 as const };
  return authenticated;
}

export async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return { error: "Authentication required", status: 401 as const };
  const { parseAccessToken } = await import("@/lib/auth");
  const userId = parseAccessToken(token);
  if (!userId) return { error: "Invalid or expired session", status: 401 as const };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, emailVerified: true } });
  if (!user) return { error: "User not found", status: 404 as const };
  if (!user.emailVerified) return { error: "Email verification is required", status: 403 as const };
  return { user };
}

export async function authenticatedAdmin(request: Request) {
  const authenticated = await authenticatedUser(request);
  if ("error" in authenticated) return authenticated;
  if (authenticated.user.role !== "ADMIN") return { error: "Administrator access required", status: 403 as const };
  return authenticated;
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}