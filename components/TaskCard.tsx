"use client";

import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  testCasesCount: number;
}

const difficultyConfig = {
  BEGINNER: {
    badge: "bg-success-50 text-success-700 ring-success-200",
    glow: "group-hover:border-success-300 group-hover:shadow-[0_0_16px_-4px_rgba(16,185,129,0.2)]",
  },
  INTERMEDIATE: {
    badge: "bg-primary-50 text-primary-700 ring-primary-200",
    glow: "group-hover:border-primary-300 group-hover:shadow-[0_0_16px_-4px_rgba(99,102,241,0.2)]",
  },
  ADVANCED: {
    badge: "bg-warning-50 text-warning-700 ring-warning-200",
    glow: "group-hover:border-warning-300 group-hover:shadow-[0_0_16px_-4px_rgba(245,158,11,0.2)]",
  },
  EXPERT: {
    badge: "bg-danger-50 text-danger-700 ring-danger-200",
    glow: "group-hover:border-danger-300 group-hover:shadow-[0_0_16px_-4px_rgba(239,68,68,0.2)]",
  },
};

export function TaskCard({
  id,
  title,
  description,
  difficulty,
  category,
  rewardTokens,
  testCasesCount,
}: TaskCardProps) {
  const config = difficultyConfig[difficulty];

  return (
    <Link href={`/tasks/${id}`}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-5 shadow-card-sm transition-all duration-300 hover:-translate-y-0.5",
          config.glow
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="flex-1 font-heading text-base font-semibold text-surface-900 transition-colors group-hover:text-primary-700">
            {title}
          </h3>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1",
              config.badge
            )}
          >
            {difficulty}
          </span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-surface-500 line-clamp-2">
          {description}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-lg bg-surface-50 px-2.5 py-1 text-xs font-medium text-surface-600 ring-1 ring-surface-200/80">
            {category}
          </span>
          <span className="inline-flex items-center rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-100">
            {testCasesCount} tests
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-surface-100 pt-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-warning-500" />
            <span className="text-lg font-bold text-warning-600">+{rewardTokens}</span>
            <span className="text-xs font-medium text-surface-500">tokens</span>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-primary-600 transition-transform duration-200 group-hover:translate-x-1">
            Start <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
