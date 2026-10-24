"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Eye } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";

const topFreelancers = [
  { rank: 1, name: "Aarav Sharma", category: "Frontend", score: 98, earnings: "₹9,20,000" },
  { rank: 2, name: "Nisha Verma", category: "Full Stack", score: 95, earnings: "₹8,40,000" },
  { rank: 3, name: "Rohan Mehta", category: "UI/UX", score: 93, earnings: "₹7,75,000" },
  { rank: 4, name: "Sana Khan", category: "AI/Data", score: 91, earnings: "₹7,10,000" },
  { rank: 5, name: "Vikram Patel", category: "Blockchain", score: 89, earnings: "₹6,85,000" },
];

const rankConfig: Record<number, { icon: typeof Trophy; gradient: string; ring: string; badge: string }> = {
  1: {
    icon: Trophy,
    gradient: "from-yellow-400 to-amber-500",
    ring: "ring-amber-300",
    badge: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
  },
  2: {
    icon: Medal,
    gradient: "from-gray-300 to-gray-400",
    ring: "ring-gray-300",
    badge: "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800",
  },
  3: {
    icon: Award,
    gradient: "from-amber-600 to-orange-700",
    ring: "ring-amber-400",
    badge: "bg-gradient-to-r from-amber-600 to-orange-700 text-white",
  },
};

export default function LeaderboardPage() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Top Freelancers Leaderboard"
      subtitle="See the best performers on 2gathers based on delivery consistency, client ratings, and earnings."
    >
      <section className="card-surface p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning-700">
              Platform ranking
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-surface-900">
              Live leaderboard view
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/start" className="btn-secondary btn-md">
              Back to Start
            </Link>
            <button onClick={() => router.push("/jobs")} className="btn-primary btn-md">
              Browse Jobs
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {topFreelancers.map((freelancer, index) => {
            const config = rankConfig[freelancer.rank];
            const isTopThree = freelancer.rank <= 3;
            const initials = freelancer.name
              .split(" ")
              .map((p) => p[0])
              .join("");

            return (
              <motion.article
                key={freelancer.rank}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-md ${
                  isTopThree
                    ? "border-surface-200/80 shadow-card-sm"
                    : "border-surface-200/60 shadow-card-sm"
                }`}
              >
                {isTopThree && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-warning-400 to-transparent" />
                )}

                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {/* Rank badge */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold ${
                      config
                        ? config.badge
                        : "bg-surface-100 text-surface-600"
                    }`}
                  >
                    #{freelancer.rank}
                  </div>

                  {/* Avatar */}
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${
                    isTopThree
                      ? `bg-gradient-to-br ${config?.gradient || "from-primary-500 to-accent-500"}`
                      : "bg-gradient-to-br from-primary-500 to-accent-500"
                  }`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-lg font-semibold text-surface-900">
                      {freelancer.name}
                    </h3>
                    <p className="text-sm text-surface-500">{freelancer.category}</p>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <p className="text-xs text-surface-500">Score</p>
                    <div className="relative mt-1">
                      {/* Progress ring */}
                      <div className="mx-auto h-14 w-14">
                        <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke={freelancer.score >= 95 ? "#10b981" : freelancer.score >= 90 ? "#6366f1" : "#f59e0b"}
                            strokeWidth="3"
                            strokeDasharray={`${(freelancer.score / 100) * 97.4} 97.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold text-surface-900">
                          {freelancer.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings & CTA */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-heading text-lg font-bold text-success-600">
                      {freelancer.earnings}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/freelancers")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-surface-800 active:scale-[0.98]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View profile
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}
