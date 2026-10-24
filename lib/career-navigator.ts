export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type SkillSource = "SELF_REPORTED" | "TASK_EVIDENCE" | "REVIEWED_EVIDENCE";

export type LearnerSkill = {
  name: string;
  level: SkillLevel;
  source: SkillSource;
};

export type RoleSkillDefinition = {
  name: string;
  requiredLevel: SkillLevel;
  importance: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
  tools: string[];
  projectIdeas: string[];
  evidence: string;
  rationale: string;
};

export type RoleFramework = {
  slug: string;
  version: number;
  name: string;
  summary: string;
  rationale: string;
  sourceNote: string;
  skills: RoleSkillDefinition[];
};

export type SkillGap = {
  skillName: string;
  requiredLevel: number;
  selfReportedLevel: number;
  demonstratedLevel: number;
  assessedLevel: number;
  assessedFrom: "SELF_REPORTED" | "TASK_EVIDENCE" | "REVIEWED_EVIDENCE" | "NONE";
  severity: "READY" | "IMPROVE" | "FOUNDATIONAL";
  priorityScore: number;
  whyItMatters: string;
  prerequisites: string[];
  recommendedActivity: string;
  evidenceRequired: string;
};

export type RoadmapItemPlan = {
  key: string;
  stage: string;
  title: string;
  objective: string;
  skillName: string;
  whyNeeded: string;
  taskDescription: string;
  effortHours: number;
  prerequisites: string[];
  acceptanceCriteria: string;
  evidenceRequired: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  targetDate: Date | null;
};

export type RoadmapPlan = {
  items: RoadmapItemPlan[];
  warnings: string[];
  impossibleDeadline: boolean;
};

const aliases: Record<string, string> = {
  html: "html/css",
  css: "html/css",
  "html5": "html/css",
  "react.js": "react",
  reactjs: "react",
  postgres: "postgresql",
  postgresql: "postgresql",
};

export function normalizeSkillName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[normalized] || normalized;
}

export function normalizeSkills(value: unknown): LearnerSkill[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, LearnerSkill>();
  for (const item of value) {
    const record = typeof item === "string" ? { name: item, level: 1, source: "SELF_REPORTED" } : item;
    if (!record || typeof record !== "object") continue;
    const raw = record as Record<string, unknown>;
    const name = typeof raw.name === "string" ? normalizeSkillName(raw.name) : "";
    const level = Number(raw.level);
    const source = raw.source === "TASK_EVIDENCE" || raw.source === "REVIEWED_EVIDENCE" ? raw.source : "SELF_REPORTED";
    if (!name || !Number.isFinite(level)) continue;
    const skill = { name, level: Math.max(0, Math.min(5, Math.round(level))) as SkillLevel, source } as LearnerSkill;
    const key = `${name}:${source}`;
    const existing = result.get(key);
    if (!existing || skill.level > existing.level) result.set(key, skill);
  }
  return [...result.values()];
}

export function validateRoleFramework(framework: RoleFramework) {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const skill of framework.skills) {
    const key = normalizeSkillName(skill.name);
    if (names.has(key)) errors.push(`Duplicate skill: ${skill.name}`);
    names.add(key);
    if (skill.requiredLevel < 0 || skill.requiredLevel > 5) errors.push(`Invalid required level: ${skill.name}`);
    if (skill.importance < 1 || skill.importance > 5) errors.push(`Invalid importance: ${skill.name}`);
    for (const prerequisite of skill.prerequisites) {
      if (!names.has(normalizeSkillName(prerequisite)) && !framework.skills.some((candidate) => normalizeSkillName(candidate.name) === normalizeSkillName(prerequisite))) errors.push(`Unknown prerequisite: ${skill.name} -> ${prerequisite}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byName = new Map(framework.skills.map((skill) => [normalizeSkillName(skill.name), skill]));
  function visit(name: string): boolean {
    if (visiting.has(name)) return true;
    if (visited.has(name)) return false;
    visiting.add(name);
    const skill = byName.get(name);
    const cycle: boolean = skill?.prerequisites.some((prerequisite) => visit(normalizeSkillName(prerequisite))) || false;
    visiting.delete(name);
    visited.add(name);
    return cycle;
  }
  for (const skill of framework.skills) if (visit(normalizeSkillName(skill.name))) errors.push(`Circular prerequisite involving: ${skill.name}`);
  return errors;
}

export function calculateSkillGaps(skills: LearnerSkill[], framework: RoleFramework): SkillGap[] {
  const grouped = new Map<string, LearnerSkill[]>();
  for (const skill of skills) grouped.set(skill.name, [...(grouped.get(skill.name) || []), skill]);
  return framework.skills.map((required) => {
    const matches = grouped.get(normalizeSkillName(required.name)) || [];
    const selfReportedLevel = Math.max(0, ...matches.filter((skill) => skill.source === "SELF_REPORTED").map((skill) => skill.level));
    const demonstratedLevel = Math.max(0, ...matches.filter((skill) => skill.source !== "SELF_REPORTED").map((skill) => skill.level));
    const assessedLevel = Math.max(selfReportedLevel, demonstratedLevel);
    const assessedFrom = demonstratedLevel > 0 ? (matches.some((skill) => skill.source === "REVIEWED_EVIDENCE" && skill.level === demonstratedLevel) ? "REVIEWED_EVIDENCE" : "TASK_EVIDENCE") : selfReportedLevel > 0 ? "SELF_REPORTED" : "NONE";
    const deficit = Math.max(0, required.requiredLevel - assessedLevel);
    const missingPrerequisites = required.prerequisites.filter((prerequisite) => {
      const dependency = framework.skills.find((skill) => normalizeSkillName(skill.name) === normalizeSkillName(prerequisite));
      const dependencyMatch = grouped.get(normalizeSkillName(prerequisite)) || [];
      return dependency && Math.max(0, ...dependencyMatch.map((skill) => skill.level)) < dependency.requiredLevel;
    });
    return {
      skillName: required.name,
      requiredLevel: required.requiredLevel,
      selfReportedLevel,
      demonstratedLevel,
      assessedLevel,
      assessedFrom,
      severity: deficit === 0 ? "READY" : assessedLevel === 0 ? "FOUNDATIONAL" : "IMPROVE",
      priorityScore: deficit * required.importance * 10 + missingPrerequisites.length * 5,
      whyItMatters: required.rationale,
      prerequisites: required.prerequisites,
      recommendedActivity: required.projectIdeas[0] || `Practice ${required.name} in a small applied exercise.`,
      evidenceRequired: required.evidence,
    } satisfies SkillGap;
  }).sort((left, right) => right.priorityScore - left.priorityScore || left.skillName.localeCompare(right.skillName));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function generateRoadmap(gaps: SkillGap[], framework: RoleFramework, weeklyHours: number, targetDate: Date | null = null, startDate = new Date(), completedSkills = new Set<string>()): RoadmapPlan {
  const warnings: string[] = [];
  const capacity = Math.max(1, Math.floor(weeklyHours));
  const activeGaps = gaps.filter((gap) => gap.priorityScore > 0 && !completedSkills.has(normalizeSkillName(gap.skillName)));
  let elapsedHours = 0;
  const items = activeGaps.map((gap) => {
    const definition = framework.skills.find((skill) => normalizeSkillName(skill.name) === normalizeSkillName(gap.skillName));
    const effortHours = Math.max(2, gap.assessedLevel === 0 ? 8 : 5 + Math.ceil(gap.priorityScore / 30));
    const stage = gap.assessedLevel === 0 ? "FOUNDATION" : gap.assessedLevel >= 2 ? "APPLIED_PRACTICE" : "FOUNDATION";
    const target = addDays(startDate, Math.ceil(((elapsedHours + effortHours) / capacity) * 7));
    elapsedHours += effortHours;
    return {
      key: normalizeSkillName(gap.skillName),
      stage,
      title: `${gap.skillName}: ${gap.recommendedActivity}`,
      objective: `Reach level ${gap.requiredLevel} in ${gap.skillName} through observable practice.`,
      skillName: gap.skillName,
      whyNeeded: gap.whyItMatters,
      taskDescription: `${gap.recommendedActivity} Use this project direction: ${definition?.projectIdeas[0] || "create a small demonstrable project"}.`,
      effortHours: Math.ceil(effortHours),
      prerequisites: gap.prerequisites,
      acceptanceCriteria: `Demonstrate the required ${gap.skillName} behavior and document what you learned.`,
      evidenceRequired: gap.evidenceRequired,
      status: "NOT_STARTED" as const,
      targetDate: target,
    };
  });
  if (targetDate && items.at(-1)?.targetDate && items.at(-1)!.targetDate! > targetDate) warnings.push("The target date is not achievable at the current weekly availability; the plan is scheduled honestly beyond it.");
  return { items, warnings, impossibleDeadline: warnings.length > 0 };
}

export function rescheduleRoadmap(items: Array<RoadmapItemPlan & { id: number }>, weeklyHours: number, startDate = new Date()) {
  const capacity = Math.max(1, Math.floor(weeklyHours));
  let elapsedHours = 0;
  return items.map((item) => {
    if (item.status === "COMPLETED") return item;
    const targetDate = addDays(startDate, Math.ceil(((elapsedHours + item.effortHours) / capacity) * 7));
    elapsedHours += item.effortHours;
    return { ...item, targetDate };
  });
}

const transitions: Record<RoadmapItemPlan["status"], RoadmapItemPlan["status"][]> = {
  NOT_STARTED: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["NOT_STARTED", "BLOCKED", "COMPLETED"],
  BLOCKED: ["IN_PROGRESS", "NOT_STARTED"],
  COMPLETED: [],
};

export function canTransitionRoadmapItem(from: RoadmapItemPlan["status"], to: RoadmapItemPlan["status"]) {
  return from === to || transitions[from].includes(to);
}

export function careerMentorFallback(question: string, context: { roleName: string; weeklyHours: number; gaps: Array<{ skillName: string; recommendedActivity: string }>; activeItems: Array<{ title: string; status: string }> }) {
  const normalizedQuestion = question.toLowerCase();
  const nextGap = context.gaps[0];
  const nextItem = context.activeItems.find((item) => item.status !== "COMPLETED");
  if (normalizedQuestion.includes("hour") || normalizedQuestion.includes("week")) return `You have ${context.weeklyHours} hours per week for ${context.roleName}. Save the new availability, then replan so unfinished milestones are rescheduled without changing completed work.`;
  if (normalizedQuestion.includes("evidence") || normalizedQuestion.includes("portfolio")) return nextGap ? `For ${nextGap.skillName}, submit a working example and explain the decisions you made. A submitted item remains unreviewed until an authorized reviewer evaluates it.` : "Add a target role and at least one skill gap before asking for evidence guidance.";
  if (normalizedQuestion.includes("why") || normalizedQuestion.includes("important")) return nextGap ? `${nextGap.skillName} is prioritized because it is a current gap in the selected ${context.roleName} framework. Start with: ${nextGap.recommendedActivity}.` : "Save your career profile so the mentor can explain a real stored gap.";
  return nextItem ? `Your next saved milestone is ${nextItem.title}. It comes from your ${context.roleName} roadmap and current gap analysis.` : `Your ${context.roleName} roadmap has no unfinished item. Add new evidence or update your skills to reassess it.`;
}

export const roleFrameworks: RoleFramework[] = [
  {
    slug: "frontend-developer",
    version: 1,
    name: "Frontend Developer",
    summary: "Build accessible, responsive interfaces that connect users to useful products.",
    rationale: "This curated framework covers browser fundamentals, component design, integration, testing, accessibility, and evidence.",
    sourceNote: "Curated platform guidance for demonstration. It is not a universal employer standard or employment guarantee.",
    skills: [
      { name: "HTML/CSS", requiredLevel: 3, importance: 5, prerequisites: [], tools: ["HTML", "CSS"], projectIdeas: ["Accessible responsive landing page"], evidence: "Responsive page with semantic markup and keyboard navigation.", rationale: "Browser structure and layout are prerequisites for every frontend project." },
      { name: "JavaScript", requiredLevel: 4, importance: 5, prerequisites: ["HTML/CSS"], tools: ["JavaScript", "Browser APIs"], projectIdeas: ["Interactive data dashboard"], evidence: "Interactive feature with clear state and error handling.", rationale: "JavaScript provides behavior and data flow behind modern interfaces." },
      { name: "React", requiredLevel: 3, importance: 4, prerequisites: ["JavaScript"], tools: ["React", "Testing Library"], projectIdeas: ["Multi-view React workspace"], evidence: "Componentized app with meaningful state and reusable UI.", rationale: "Component architecture makes larger interfaces maintainable." },
      { name: "API integration", requiredLevel: 3, importance: 4, prerequisites: ["JavaScript"], tools: ["Fetch", "REST"], projectIdeas: ["Search experience backed by an API"], evidence: "Loading, empty, error, and success states backed by an API.", rationale: "Product interfaces need reliable communication with server data." },
      { name: "Testing", requiredLevel: 2, importance: 3, prerequisites: ["JavaScript", "React"], tools: ["Vitest", "Playwright"], projectIdeas: ["Test a critical user flow"], evidence: "Focused unit and browser tests for a critical workflow.", rationale: "Tests make behavior changes safer and demonstrate engineering discipline." },
      { name: "Accessibility", requiredLevel: 3, importance: 3, prerequisites: ["HTML/CSS", "React"], tools: ["ARIA", "Keyboard navigation"], projectIdeas: ["Accessible form workflow"], evidence: "Keyboard-usable, labeled, semantically structured interaction.", rationale: "Accessible interfaces serve more users and reveal quality in implementation." },
      { name: "Performance", requiredLevel: 2, importance: 2, prerequisites: ["React"], tools: ["Web Vitals", "DevTools"], projectIdeas: ["Optimize a data-heavy view"], evidence: "Before-and-after notes identifying a measurable optimization.", rationale: "Performance work helps a frontend project remain usable as it grows." },
    ],
  },
  {
    slug: "full-stack-developer",
    version: 1,
    name: "Full Stack Developer",
    summary: "Build complete product workflows across browser, server, data, and deployment boundaries.",
    rationale: "This curated framework combines practical frontend and backend fundamentals with security, testing, and end-to-end delivery.",
    sourceNote: "Curated platform guidance for demonstration. It is not a universal employer standard or employment guarantee.",
    skills: [
      { name: "HTML/CSS", requiredLevel: 3, importance: 4, prerequisites: [], tools: ["HTML", "CSS"], projectIdeas: ["Responsive product interface"], evidence: "Accessible responsive interface with semantic markup.", rationale: "A full-stack product still needs a usable browser experience." },
      { name: "JavaScript", requiredLevel: 4, importance: 5, prerequisites: ["HTML/CSS"], tools: ["JavaScript", "TypeScript"], projectIdeas: ["Interactive product workflow"], evidence: "Interactive workflow with validation and error handling.", rationale: "JavaScript connects interface behavior to application data." },
      { name: "React", requiredLevel: 3, importance: 3, prerequisites: ["JavaScript"], tools: ["React", "Testing Library"], projectIdeas: ["Multi-view application"], evidence: "Reusable components with state and loading/error states.", rationale: "Component architecture supports maintainable product interfaces." },
      { name: "HTTP and APIs", requiredLevel: 3, importance: 5, prerequisites: ["JavaScript"], tools: ["REST", "Fetch"], projectIdeas: ["Authenticated JSON API integration"], evidence: "Documented API integration with validated responses.", rationale: "Full-stack work depends on reliable client-server contracts." },
      { name: "Database design", requiredLevel: 3, importance: 4, prerequisites: ["HTTP and APIs"], tools: ["SQL", "PostgreSQL", "Prisma"], projectIdeas: ["Relational project tracker"], evidence: "Owned records, constraints, indexes, and query rationale.", rationale: "Persistent data integrity is central to complete product workflows." },
      { name: "Authentication and security", requiredLevel: 3, importance: 5, prerequisites: ["HTTP and APIs", "Database design"], tools: ["Sessions", "Zod", "Authorization"], projectIdeas: ["Role-aware account flow"], evidence: "Server-side authorization and invalid-input tests.", rationale: "A full-stack feature must protect users across every boundary." },
      { name: "Testing", requiredLevel: 3, importance: 3, prerequisites: ["React", "HTTP and APIs"], tools: ["Vitest", "Playwright"], projectIdeas: ["End-to-end product flow"], evidence: "Unit, API, and browser coverage for a critical workflow.", rationale: "Tests make cross-layer changes safer to ship." },
    ],
  },
  {
    slug: "backend-developer",
    version: 1,
    name: "Backend Developer",
    summary: "Design dependable services, data flows, and APIs for real product workflows.",
    rationale: "This curated framework covers programming, HTTP, data modeling, security, and service evidence.",
    sourceNote: "Curated platform guidance for demonstration. It is not a universal employer standard or employment guarantee.",
    skills: [
      { name: "Programming fundamentals", requiredLevel: 4, importance: 5, prerequisites: [], tools: ["TypeScript", "Python"], projectIdeas: ["CLI data processor"], evidence: "Well-structured program with validation and tests.", rationale: "Reliable backend work starts with clear control flow and data handling." },
      { name: "HTTP and APIs", requiredLevel: 4, importance: 5, prerequisites: ["Programming fundamentals"], tools: ["HTTP", "REST"], projectIdeas: ["Authenticated JSON API"], evidence: "Documented endpoints with validation and consistent errors.", rationale: "APIs are contracts between services and product experiences." },
      { name: "Database design", requiredLevel: 3, importance: 4, prerequisites: ["Programming fundamentals"], tools: ["SQL", "PostgreSQL"], projectIdeas: ["Relational project tracker"], evidence: "Schema with ownership, constraints, and query rationale.", rationale: "Data integrity and retrieval shape product reliability." },
      { name: "Authentication and security", requiredLevel: 3, importance: 4, prerequisites: ["HTTP and APIs"], tools: ["Sessions", "Validation"], projectIdeas: ["Role-aware account service"], evidence: "Server-side authorization and validated input paths.", rationale: "Backend features must protect data and user actions at the server boundary." },
      { name: "Testing", requiredLevel: 3, importance: 3, prerequisites: ["HTTP and APIs"], tools: ["Vitest", "Integration tests"], projectIdeas: ["API regression suite"], evidence: "Tests covering success, validation, and authorization failures.", rationale: "Service behavior is easier to evolve when contracts are executable." },
    ],
  },
  {
    slug: "data-analyst",
    version: 1,
    name: "Data Analyst",
    summary: "Turn messy data into understandable analysis and decisions with reproducible evidence.",
    rationale: "This curated framework covers data literacy, SQL, statistics, visualization, and reproducibility.",
    sourceNote: "Curated platform guidance for demonstration. It is not a universal employer standard or employment guarantee.",
    skills: [
      { name: "Data literacy", requiredLevel: 3, importance: 5, prerequisites: [], tools: ["Spreadsheets", "Data dictionaries"], projectIdeas: ["Data quality review"], evidence: "Clear definitions, assumptions, and data-quality notes.", rationale: "Good analysis begins by understanding what data represents." },
      { name: "SQL", requiredLevel: 4, importance: 5, prerequisites: ["Data literacy"], tools: ["PostgreSQL", "SQL"], projectIdeas: ["Cohort analysis"], evidence: "Queries with joins, aggregation, and explainable results.", rationale: "SQL retrieves and shapes structured data directly." },
      { name: "Statistics", requiredLevel: 3, importance: 4, prerequisites: ["Data literacy"], tools: ["Descriptive statistics"], projectIdeas: ["Experiment readout"], evidence: "Analysis that states uncertainty and avoids overclaiming.", rationale: "Statistical reasoning helps separate signal from noise." },
      { name: "Visualization", requiredLevel: 3, importance: 4, prerequisites: ["SQL"], tools: ["Charts", "Dashboards"], projectIdeas: ["Decision dashboard"], evidence: "Chart choices tied to questions, audience, and limitations.", rationale: "Useful visualization makes findings easier to inspect and act on." },
      { name: "Python analysis", requiredLevel: 2, importance: 3, prerequisites: ["SQL"], tools: ["Python", "pandas"], projectIdeas: ["Reproducible notebook"], evidence: "Repeatable analysis with documented inputs and outputs.", rationale: "Code can make exploratory and repeatable analysis more scalable." },
    ],
  },
];