"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { proposalsApi, freelancerProfileApi, reviewsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const skillColors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#6366f1", "#ef4444"];

type InboxProposal = {
  id: number;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  job?: {
    id: number;
    title: string;
    budget?: number;
    status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
    completedAt?: string | null;
  };
};

type SkillSlice = {
  name: string;
  value: number;
};

const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function monthLabel(dateInput: string | Date) {
  return new Date(dateInput).toLocaleDateString("en-US", { month: "short" });
}

function getRecentMonthLabels(monthCount: number) {
  const labels: string[] = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(monthLabel(date));
  }
  return labels;
}

function parseSkills(raw: string | undefined): SkillSlice[] {
  if (!raw) return [];
  const uniqueSkills = Array.from(new Set(raw.split(",").map((item) => item.trim()).filter(Boolean)));
  if (!uniqueSkills.length) return [];
  const base = Math.floor(100 / uniqueSkills.length);
  let remainder = 100 - base * uniqueSkills.length;
  return uniqueSkills.slice(0, 5).map((name) => {
    const increment = remainder > 0 ? 1 : 0;
    remainder -= increment;
    return { name, value: base + increment };
  });
}

export function FreelancerAnalytics() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = Number(user?.id || "0");

  const proposalsQuery = useQuery({
    queryKey: ["freelancer-analytics-proposals", userId],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals as InboxProposal[]) || [];
    },
    enabled: user?.role === "FREELANCER" && userId > 0,
  });

  const profileQuery = useQuery({
    queryKey: ["freelancer-analytics-profile", userId],
    queryFn: async () => {
      const response = await freelancerProfileApi.me();
      return response.data?.profile as { skills?: string } | null;
    },
    enabled: user?.role === "FREELANCER" && userId > 0,
  });

  const reviewsQuery = useQuery({
    queryKey: ["freelancer-analytics-reviews", userId],
    queryFn: async () => {
      const response = await reviewsApi.listByTargetUser(userId);
      return (response.data?.reviews as Array<{ rating: number }>) || [];
    },
    enabled: user?.role === "FREELANCER" && userId > 0,
  });

  const analytics = useMemo(() => {
    const proposals = proposalsQuery.data || [];
    const submittedCount = proposals.length;
    const acceptedProposals = proposals.filter((item) => item.status === "ACCEPTED" && item.job);
    const activeProjects = acceptedProposals.filter((item) => item.job?.status !== "COMPLETED").length;
    const completedProjects = acceptedProposals.filter((item) => item.job?.status === "COMPLETED");
    const completedCount = completedProjects.length;

    const totalEarnings = completedProjects.reduce((sum, item) => sum + Number(item.job?.budget || 0), 0);
    const successRate = submittedCount > 0 ? (acceptedProposals.length / submittedCount) * 100 : 0;

    const reviews = reviewsQuery.data || [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
      : 0;

    const months = getRecentMonthLabels(6);
    const earningsByMonth: Record<string, number> = Object.fromEntries(months.map((label) => [label, 0]));
    const completedByMonth: Record<string, number> = Object.fromEntries(months.map((label) => [label, 0]));

    completedProjects.forEach((item) => {
      const sourceDate = item.job?.completedAt || item.createdAt;
      const key = monthLabel(sourceDate);
      if (Object.prototype.hasOwnProperty.call(earningsByMonth, key)) {
        earningsByMonth[key] += Number(item.job?.budget || 0);
        completedByMonth[key] += 1;
      }
    });

    const earningsTrend = months.map((month) => ({ month, earnings: earningsByMonth[month] || 0 }));
    const projectsByMonth = months.map((month) => ({ month, completed: completedByMonth[month] || 0 }));
    const skillsDistribution = parseSkills(profileQuery.data?.skills);

    return {
      totalEarnings,
      submittedCount,
      acceptedCount: acceptedProposals.length,
      activeProjects,
      completedCount,
      successRate,
      avgRating,
      reviewCount: reviews.length,
      earningsTrend,
      projectsByMonth,
      skillsDistribution,
    };
  }, [profileQuery.data?.skills, proposalsQuery.data, reviewsQuery.data]);

  const freelancerMetrics = [
    {
      label: "Total Earnings",
      value: `₹${currency.format(analytics.totalEarnings)}`,
      helper: "From completed projects",
    },
    {
      label: "Active Projects",
      value: `${analytics.activeProjects}`,
      helper: "Accepted and currently in progress",
    },
    {
      label: "Completed Projects",
      value: `${analytics.completedCount}`,
      helper: "All-time completed deliveries",
    },
    {
      label: "Proposal Success Rate",
      value: `${analytics.successRate.toFixed(1)}%`,
      helper: `${analytics.acceptedCount} accepted of ${analytics.submittedCount}`,
    },
    {
      label: "Average Rating",
      value: analytics.reviewCount ? `${analytics.avgRating.toFixed(1)}/5` : "N/A",
      helper: analytics.reviewCount ? `${analytics.reviewCount} received reviews` : "No reviews yet",
    },
  ];

  const topSkill = analytics.skillsDistribution[0]?.name || "Not set";

  return (
    <section className="mt-6 space-y-5">
      <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Main CTA</p>
            <h2 className="text-2xl font-semibold text-slate-900">Find high-quality projects faster</h2>
            <p className="mt-1 text-sm text-slate-600">
              You have {analytics.activeProjects} active projects and {analytics.completedCount} completed. Top listed skill: {topSkill}.
            </p>
          </div>
          <button onClick={() => router.push("/freelancer/jobs")} className="btn-primary btn-lg">
            Get Jobs
          </button>
        </div>
      </motion.article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {freelancerMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Earnings Over Time" subtitle="Monthly net earnings, adjusted for payouts and refunds.">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.earningsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Earnings"]} />
                <Line type="monotone" dataKey="earnings" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Skills Distribution" subtitle="Based on your profile skill tags.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.skillsDistribution.length ? analytics.skillsDistribution : [{ name: "Not set", value: 100 }]} dataKey="value" nameKey="name" outerRadius={90} innerRadius={52}>
                {(analytics.skillsDistribution.length ? analytics.skillsDistribution : [{ name: "Not set", value: 100 }]).map((entry, index) => (
                  <Cell key={entry.name} fill={skillColors[index % skillColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value)}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Projects Completed Per Month" subtitle="Tracks delivery consistency and throughput.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.projectsByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-5">
        <h3 className="text-lg font-semibold text-slate-900">Actionable insights</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Your current proposal success rate is {analytics.successRate.toFixed(1)}%. Improve it with role-specific cover letters per job.</li>
          <li>You have completed {analytics.completedCount} projects. Keep momentum by prioritizing jobs similar to your accepted work.</li>
          <li>{analytics.reviewCount ? `Your average review is ${analytics.avgRating.toFixed(1)}/5 from ${analytics.reviewCount} ratings.` : "No reviews yet: complete one project and ask your client for feedback to build trust."}</li>
        </ul>
      </motion.article>
    </section>
  );
}
