import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Demo@1234", 10);
const skills = [
  ["HTML/CSS", 3, 5, []],
  ["JavaScript", 4, 5, ["HTML/CSS"]],
  ["React", 3, 4, ["JavaScript"]],
  ["API integration", 3, 4, ["JavaScript"]],
  ["Testing", 2, 3, ["JavaScript", "React"]],
  ["Accessibility", 3, 3, ["HTML/CSS", "React"]],
  ["Performance", 2, 2, ["React"]],
];

const role = await prisma.careerRoleFramework.upsert({
  where: { slug_version: { slug: "frontend-developer", version: 1 } },
  update: { name: "Frontend Developer", summary: "Build accessible, responsive interfaces that connect users to useful products.", rationale: "Curated guidance for browser fundamentals, components, integrations, quality, and evidence.", sourceNote: "Curated platform guidance for demonstration; not a universal employer standard.", isActive: true },
  create: { slug: "frontend-developer", version: 1, name: "Frontend Developer", summary: "Build accessible, responsive interfaces that connect users to useful products.", rationale: "Curated guidance for browser fundamentals, components, integrations, quality, and evidence.", sourceNote: "Curated platform guidance for demonstration; not a universal employer standard." },
});

for (const [skillName, requiredLevel, importance, prerequisites] of skills) {
  await prisma.careerRoleSkill.upsert({
    where: { roleId_skillName: { roleId: role.id, skillName } },
    update: { requiredLevel, importance, prerequisites, tools: [], projectIdeas: [`Practical ${skillName} project`], evidence: `Working ${skillName} example with a short explanation.`, rationale: `${skillName} is part of the curated frontend practice framework.` },
    create: { roleId: role.id, skillName, requiredLevel, importance, prerequisites, tools: [], projectIdeas: [`Practical ${skillName} project`], evidence: `Working ${skillName} example with a short explanation.`, rationale: `${skillName} is part of the curated frontend practice framework.` },
  });
}

const demos = [
  { email: "career-beginner@2gathers.dev", name: "Career Demo Beginner", weeklyHours: 6, careerStage: "BEGINNER", skills: [{ name: "HTML/CSS", level: 1 }, { name: "JavaScript", level: 1 }], previousProjects: [] },
  { email: "career-intermediate@2gathers.dev", name: "Career Demo Intermediate", weeklyHours: 12, careerStage: "INTERMEDIATE", skills: [{ name: "HTML/CSS", level: 3 }, { name: "JavaScript", level: 4 }, { name: "React", level: 3 }], previousProjects: [{ title: "Project Alpha", description: "React project with reusable components." }, { title: "Project Beta", description: "JavaScript project consuming a public API." }] },
];

for (const demo of demos) {
  const user = await prisma.user.upsert({
    where: { email: demo.email },
    update: { name: demo.name, username: demo.email.split("@")[0], role: "FREELANCER", passwordHash, emailVerified: true },
    create: { name: demo.name, username: demo.email.split("@")[0], email: demo.email, role: "FREELANCER", passwordHash, emailVerified: true, tokens: 50 },
  });
  const profile = await prisma.careerProfile.upsert({
    where: { userId: user.id },
    update: { targetRoleId: role.id, skills: demo.skills, interests: "Product interfaces and practical frontend work", previousProjects: demo.previousProjects, careerStage: demo.careerStage, weeklyHours: demo.weeklyHours },
    create: { userId: user.id, targetRoleId: role.id, skills: demo.skills, interests: "Product interfaces and practical frontend work", previousProjects: demo.previousProjects, careerStage: demo.careerStage, weeklyHours: demo.weeklyHours },
  });
  const levels = new Map(demo.skills.map((skill) => [skill.name.toLowerCase(), skill.level]));
  const gaps = skills.map(([skillName, requiredLevel, importance, prerequisites]) => {
    const current = levels.get(String(skillName).toLowerCase()) || 0;
    const deficit = Math.max(0, Number(requiredLevel) - current);
    return { skillName, requiredLevel: Number(requiredLevel), selfReportedLevel: current, demonstratedLevel: 0, assessedLevel: current, assessedFrom: current ? "SELF_REPORTED" : "NONE", severity: deficit === 0 ? "READY" : current === 0 ? "FOUNDATIONAL" : "IMPROVE", priorityScore: deficit * Number(importance) * 10, whyItMatters: `${skillName} supports reliable frontend work.`, prerequisites, recommendedActivity: `Build a small ${skillName} exercise`, evidenceRequired: `Working ${skillName} example with a short explanation.` };
  }).filter((gap) => gap.priorityScore > 0);
  const assessment = await prisma.careerSkillAssessment.create({ data: { profileId: profile.id, roleId: role.id, frameworkVersion: 1, result: { gaps, demoProfile: demo.careerStage } } });
  await prisma.careerRoadmap.deleteMany({ where: { profileId: profile.id } });
  const roadmap = await prisma.careerRoadmap.create({ data: { profileId: profile.id, roleId: role.id, assessmentId: assessment.id, activeKey: String(profile.id), weeklyHours: demo.weeklyHours, targetDate: null, changeReason: "Development demo fixture", items: { create: gaps.map((gap, index) => ({ stage: gap.assessedLevel === 0 ? "FOUNDATION" : "APPLIED_PRACTICE", title: `${gap.skillName} practice`, objective: `Build observable confidence in ${gap.skillName}.`, skillName: gap.skillName, whyNeeded: gap.whyItMatters, taskDescription: gap.recommendedActivity, effortHours: demo.careerStage === "BEGINNER" ? 8 : 4, prerequisites: gap.prerequisites, acceptanceCriteria: `Demonstrate ${gap.skillName} in a working example.`, evidenceRequired: gap.evidenceRequired, targetDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000) })) } } });
  await prisma.careerProgressEvent.create({ data: { userId: user.id, roadmapId: roadmap.id, eventType: "DEMO_PROFILE_SEEDED", details: { profile: demo.careerStage, role: "frontend-developer" } } });
  console.log(`${demo.email} / Demo@1234`);
}

await prisma.$disconnect();