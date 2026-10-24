import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const user = await prisma.user.findFirst({ where: { OR: [{ username: "freelancer_demo" }, { email: "freelancer.demo@2gathers.dev" }] }, select: { id: true, username: true, email: true } });
if (!user) throw new Error("freelancer_demo was not found. Run scripts/create-demo-login.mjs first.");

const skills = [
  ["HTML/CSS", 3, 4, 4, []],
  ["JavaScript", 4, 5, 4, ["HTML/CSS"]],
  ["React", 3, 3, 3, ["JavaScript"]],
  ["HTTP and APIs", 3, 5, 3, ["JavaScript"]],
  ["Database design", 3, 4, 2, ["HTTP and APIs"]],
  ["Authentication and security", 3, 5, 2, ["HTTP and APIs", "Database design"]],
  ["Testing", 3, 3, 2, ["React", "HTTP and APIs"]],
];

const role = await prisma.careerRoleFramework.upsert({
  where: { slug_version: { slug: "full-stack-developer", version: 1 } },
  update: { name: "Full Stack Developer", summary: "Build complete product workflows across browser, server, data, and deployment boundaries.", rationale: "Curated guidance for practical frontend, backend, data, security, and testing work.", sourceNote: "Curated platform guidance for demonstration; not a universal employer standard.", isActive: true },
  create: { slug: "full-stack-developer", version: 1, name: "Full Stack Developer", summary: "Build complete product workflows across browser, server, data, and deployment boundaries.", rationale: "Curated guidance for practical frontend, backend, data, security, and testing work.", sourceNote: "Curated platform guidance for demonstration; not a universal employer standard." },
});

for (const [skillName, requiredLevel, importance, currentLevel, prerequisites] of skills) {
  await prisma.careerRoleSkill.upsert({
    where: { roleId_skillName: { roleId: role.id, skillName } },
    update: { requiredLevel, importance, prerequisites, tools: [], projectIdeas: [`Build a production-style ${skillName} feature`], evidence: `Working ${skillName} implementation with a short explanation and tests where relevant.`, rationale: `${skillName} is part of the curated full-stack framework.` },
    create: { roleId: role.id, skillName, requiredLevel, importance, prerequisites, tools: [], projectIdeas: [`Build a production-style ${skillName} feature`], evidence: `Working ${skillName} implementation with a short explanation and tests where relevant.`, rationale: `${skillName} is part of the curated full-stack framework.` },
  });
}

const learnerSkills = skills.map(([name, , , level]) => ({ name, level, source: name === "JavaScript" || name === "React" ? "REVIEWED_EVIDENCE" : "SELF_REPORTED" }));
const gaps = skills.map(([skillName, requiredLevel, importance, currentLevel, prerequisites]) => {
  const deficit = Math.max(0, Number(requiredLevel) - Number(currentLevel));
  return { skillName, requiredLevel: Number(requiredLevel), selfReportedLevel: Number(currentLevel), demonstratedLevel: Number(currentLevel), assessedLevel: Number(currentLevel), assessedFrom: "REVIEWED_EVIDENCE", severity: deficit === 0 ? "READY" : "IMPROVE", priorityScore: deficit * Number(importance) * 10, whyItMatters: `${skillName} is important for delivering reliable full-stack product work.`, prerequisites, recommendedActivity: `Build a production-style ${skillName} feature`, evidenceRequired: `Working ${skillName} implementation with a short explanation and tests where relevant.` };
}).filter((gap) => gap.priorityScore > 0);

const profile = await prisma.careerProfile.upsert({
  where: { userId: user.id },
  update: { targetRoleId: role.id, background: "Intermediate full-stack developer with experience building React interfaces and API-backed product features.", skills: learnerSkills, interests: "SaaS products, developer tools, reliable APIs, and accessible user experiences", previousProjects: [{ title: "Marketplace Dashboard", description: "A React dashboard with reusable components and authenticated API calls.", url: "https://github.com/freelancer-demo/marketplace-dashboard" }, { title: "Task API", description: "A TypeScript API with PostgreSQL persistence and validation.", url: "https://github.com/freelancer-demo/task-api" }], careerStage: "INTERMEDIATE", weeklyHours: 12, targetDate: new Date("2027-01-30T00:00:00.000Z"), learningPreferences: "Project-based learning with short focused exercises" },
  create: { userId: user.id, targetRoleId: role.id, background: "Intermediate full-stack developer with experience building React interfaces and API-backed product features.", skills: learnerSkills, interests: "SaaS products, developer tools, reliable APIs, and accessible user experiences", previousProjects: [{ title: "Marketplace Dashboard", description: "A React dashboard with reusable components and authenticated API calls.", url: "https://github.com/freelancer-demo/marketplace-dashboard" }, { title: "Task API", description: "A TypeScript API with PostgreSQL persistence and validation.", url: "https://github.com/freelancer-demo/task-api" }], careerStage: "INTERMEDIATE", weeklyHours: 12, targetDate: new Date("2027-01-30T00:00:00.000Z"), learningPreferences: "Project-based learning with short focused exercises" },
});

const assessment = await prisma.careerSkillAssessment.create({ data: { profileId: profile.id, roleId: role.id, frameworkVersion: 1, result: { gaps, demoProfile: "FULL_STACK_INTERMEDIATE", generatedAt: new Date().toISOString() } } });
await prisma.$transaction(async (transaction) => {
  await transaction.careerRoadmap.updateMany({ where: { profileId: profile.id, status: "ACTIVE" }, data: { status: "ARCHIVED", activeKey: null, changeReason: "Replaced by full-stack demo profile" } });
  const roadmap = await transaction.careerRoadmap.create({ data: { profileId: profile.id, roleId: role.id, assessmentId: assessment.id, activeKey: String(profile.id), revision: 1, weeklyHours: 12, targetDate: profile.targetDate, changeReason: "Full-stack demo profile initialized", items: { create: gaps.map((gap, index) => ({ stage: index < 2 ? "APPLIED_PRACTICE" : "INTEGRATED_PROJECT", title: `${gap.skillName}: ${gap.recommendedActivity}`, objective: `Reach level ${gap.requiredLevel} in ${gap.skillName} through observable practice.`, skillName: gap.skillName, whyNeeded: gap.whyItMatters, taskDescription: gap.recommendedActivity, effortHours: 5, prerequisites: gap.prerequisites, acceptanceCriteria: `Demonstrate ${gap.skillName} in a working product slice.`, evidenceRequired: gap.evidenceRequired, status: "NOT_STARTED", targetDate: new Date(Date.now() + (index + 1) * 14 * 24 * 60 * 60 * 1000) })) } } });
  await transaction.careerProgressEvent.create({ data: { userId: user.id, roadmapId: roadmap.id, eventType: "FULL_STACK_DEMO_INITIALIZED", details: { role: "full-stack-developer", weeklyHours: 12, projectCount: 2 } } });
});

console.log({ username: user.username, email: user.email, role: role.name, profileId: profile.id, gapCount: gaps.length, complete: true });
await prisma.$disconnect();