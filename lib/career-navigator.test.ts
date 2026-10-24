import { describe, expect, it } from "vitest";
import {
  calculateSkillGaps,
  canTransitionRoadmapItem,
  generateRoadmap,
  normalizeSkills,
  rescheduleRoadmap,
  roleFrameworks,
  validateRoleFramework,
} from "@/lib/career-navigator";

describe("Career Navigator deterministic engine", () => {
  const frontend = roleFrameworks[0];

  it("normalizes aliases and preserves evidence source", () => {
    expect(normalizeSkills([
      { name: "React.js", level: 2, source: "SELF_REPORTED" },
      { name: "react", level: 3, source: "TASK_EVIDENCE" },
      { name: "HTML", level: 1 },
    ])).toEqual([
      { name: "react", level: 2, source: "SELF_REPORTED" },
      { name: "react", level: 3, source: "TASK_EVIDENCE" },
      { name: "html/css", level: 1, source: "SELF_REPORTED" },
    ]);
  });

  it("distinguishes demonstrated skill from self-report and explains priority", () => {
    const gaps = calculateSkillGaps(normalizeSkills([
      { name: "HTML/CSS", level: 2, source: "SELF_REPORTED" },
      { name: "JavaScript", level: 2, source: "SELF_REPORTED" },
      { name: "JavaScript", level: 3, source: "REVIEWED_EVIDENCE" },
    ]), frontend);
    const javascript = gaps.find((gap) => gap.skillName === "JavaScript");
    expect(javascript?.selfReportedLevel).toBe(2);
    expect(javascript?.demonstratedLevel).toBe(3);
    expect(javascript?.assessedFrom).toBe("REVIEWED_EVIDENCE");
    expect(javascript?.priorityScore).toBeGreaterThan(0);
    expect(javascript?.whyItMatters).toContain("JavaScript");
  });

  it("detects circular or unknown prerequisites", () => {
    const invalid = { ...frontend, skills: [
      { ...frontend.skills[0], name: "A", prerequisites: ["B"] },
      { ...frontend.skills[1], name: "B", prerequisites: ["A"] },
      { ...frontend.skills[2], name: "C", prerequisites: ["Missing"] },
    ] };
    const errors = validateRoleFramework(invalid);
    expect(errors.some((error) => error.includes("Circular"))).toBe(true);
    expect(errors.some((error) => error.includes("Unknown prerequisite"))).toBe(true);
  });

  it("creates meaningfully different plans and reports impossible deadlines", () => {
    const beginner = calculateSkillGaps(normalizeSkills([{ name: "HTML/CSS", level: 1 }, { name: "JavaScript", level: 1 }]), frontend);
    const intermediate = calculateSkillGaps(normalizeSkills([{ name: "HTML/CSS", level: 3 }, { name: "JavaScript", level: 4 }, { name: "React", level: 3 }]), frontend);
    const start = new Date("2026-01-05T00:00:00.000Z");
    const beginnerPlan = generateRoadmap(beginner, frontend, 6, new Date("2026-01-15T00:00:00.000Z"), start);
    const intermediatePlan = generateRoadmap(intermediate, frontend, 12, null, start);
    expect(beginnerPlan.items.length).toBeGreaterThan(intermediatePlan.items.length);
    expect(beginnerPlan.impossibleDeadline).toBe(true);
    expect(intermediatePlan.items.some((item) => item.skillName === "Testing")).toBe(true);
  });

  it("preserves completed items and rejects completed-to-incomplete transitions", () => {
    const completedDate = new Date("2026-01-10T00:00:00.000Z");
    const items = [
      { id: 1, key: "html/css", stage: "FOUNDATION", title: "Done", objective: "", skillName: "HTML/CSS", whyNeeded: "", taskDescription: "", effortHours: 8, prerequisites: [], acceptanceCriteria: "", evidenceRequired: "", status: "COMPLETED" as const, targetDate: completedDate },
      { id: 2, key: "react", stage: "APPLIED_PRACTICE", title: "Next", objective: "", skillName: "React", whyNeeded: "", taskDescription: "", effortHours: 8, prerequisites: [], acceptanceCriteria: "", evidenceRequired: "", status: "NOT_STARTED" as const, targetDate: new Date("2026-01-12T00:00:00.000Z") },
    ];
    const replanned = rescheduleRoadmap(items, 4, new Date("2026-01-05T00:00:00.000Z"));
    expect(replanned[0].targetDate).toEqual(completedDate);
    expect(replanned[1].targetDate).not.toEqual(items[1].targetDate);
    expect(canTransitionRoadmapItem("COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransitionRoadmapItem("IN_PROGRESS", "COMPLETED")).toBe(true);
  });
});