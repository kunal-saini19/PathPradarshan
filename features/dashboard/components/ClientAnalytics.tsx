"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { jobsApi, proposalsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const categoryColors = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#f43f5e"];

type ClientJob = {
  id: number;
  title: string;
  budget: number;
  clientId: number;
  status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  completedAt?: string | null;
};

type ClientProposal = {
  id: number;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  job?: {
    id: number;
    title: string;
  };
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

export function ClientAnalytics() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = Number(user?.id || "0");

  const jobsQuery = useQuery({
    queryKey: ["client-analytics-jobs", userId],
    queryFn: async () => {
      const response = await jobsApi.list();
      const jobs = (response.data?.jobs as ClientJob[]) || [];
      return jobs.filter((job) => job.clientId === userId);
    },
    enabled: user?.role === "CLIENT" && userId > 0,
  });

  const proposalsQuery = useQuery({
    queryKey: ["client-analytics-proposals", userId],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals as ClientProposal[]) || [];
    },
    enabled: user?.role === "CLIENT" && userId > 0,
  });

  const analytics = useMemo(() => {
    const jobs = jobsQuery.data || [];
    const proposals = proposalsQuery.data || [];
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((job) => job.status === "OPEN" || job.status === "ACCEPTED" || job.status === "IN_PROGRESS").length;
    const completedJobs = jobs.filter((job) => job.status === "COMPLETED");

    const totalBudget = jobs.reduce((sum, job) => sum + Number(job.budget || 0), 0);
    const completedSpending = completedJobs.reduce((sum, job) => sum + Number(job.budget || 0), 0);
    const avgBudget = totalJobs > 0 ? totalBudget / totalJobs : 0;
    const proposalsPerJob = totalJobs > 0 ? proposals.length / totalJobs : 0;

    const shortlistedCount = proposals.filter((item) => item.status === "SHORTLISTED").length;
    const acceptedCount = proposals.filter((item) => item.status === "ACCEPTED").length;
    const responseRate = proposals.length > 0 ? ((shortlistedCount + acceptedCount) / proposals.length) * 100 : 0;

    const months = getRecentMonthLabels(6);
    const spendingByMonth: Record<string, number> = Object.fromEntries(months.map((label) => [label, 0]));
    const postedByMonth: Record<string, number> = Object.fromEntries(months.map((label) => [label, 0]));
    const completedByMonth: Record<string, number> = Object.fromEntries(months.map((label) => [label, 0]));

    jobs.forEach((job) => {
      const postedMonth = monthLabel(job.createdAt);
      if (Object.prototype.hasOwnProperty.call(postedByMonth, postedMonth)) {
        postedByMonth[postedMonth] += 1;
      }
      if (job.status === "COMPLETED") {
        const completedMonth = monthLabel(job.completedAt || job.createdAt);
        if (Object.prototype.hasOwnProperty.call(completedByMonth, completedMonth)) {
          completedByMonth[completedMonth] += 1;
          spendingByMonth[completedMonth] += Number(job.budget || 0);
        }
      }
    });

    const statusDistribution = [
      { name: "Submitted", value: proposals.filter((item) => item.status === "SUBMITTED").length },
      { name: "Shortlisted", value: shortlistedCount },
      { name: "Accepted", value: acceptedCount },
      { name: "Rejected", value: proposals.filter((item) => item.status === "REJECTED").length },
    ].filter((item) => item.value > 0);

    return {
      totalJobs,
      activeJobs,
      completedCount: completedJobs.length,
      totalBudget,
      completedSpending,
      avgBudget,
      proposalsPerJob,
      responseRate,
      spendingTrend: months.map((month) => ({ month, spending: spendingByMonth[month] || 0 })),
      jobsComparison: months.map((month) => ({ month, posted: postedByMonth[month] || 0, completed: completedByMonth[month] || 0 })),
      statusDistribution: statusDistribution.length ? statusDistribution : [{ name: "No Proposals", value: 100 }],
    };
  }, [jobsQuery.data, proposalsQuery.data]);

  const clientMetrics = [
    {
      label: "Total Jobs Posted",
      value: `${analytics.totalJobs}`,
      helper: "All-time job postings",
    },
    {
      label: "Active Jobs",
      value: `${analytics.activeJobs}`,
      helper: "Open, accepted, or in progress",
    },
    {
      label: "Completed Jobs",
      value: `${analytics.completedCount}`,
      helper: "Delivered and closed",
    },
    {
      label: "Total Budget Posted",
      value: `₹${currency.format(analytics.totalBudget)}`,
      helper: "Across all posted jobs",
    },
    {
      label: "Proposals / Job",
      value: analytics.totalJobs ? analytics.proposalsPerJob.toFixed(1) : "0.0",
      helper: `Client response rate ${analytics.responseRate.toFixed(1)}%`,
    },
  ];

  return (
    <section className="mt-6 space-y-5">
      <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Main CTA</p>
            <h2 className="text-2xl font-semibold text-slate-900">Scale delivery with better hiring velocity</h2>
            <p className="mt-1 text-sm text-slate-600">
              You have {analytics.activeJobs} active jobs and {analytics.completedCount} completed projects with live proposal tracking.
            </p>
          </div>
          <button onClick={() => router.push("/client/post-job")} className="btn-primary btn-lg">
            Post a Job
          </button>
        </div>
      </motion.article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {clientMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Spending Over Time" subtitle="Monthly spending trend across completed payouts.">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Spending"]} />
                <Line type="monotone" dataKey="spending" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Proposal Status Distribution" subtitle="Current proposal pipeline across your jobs.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.statusDistribution} dataKey="value" nameKey="name" outerRadius={90} innerRadius={52}>
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value)}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Jobs Posted vs Completed" subtitle="Hiring efficiency by month.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.jobsComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="posted" fill="#94a3b8" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-5">
        <h3 className="text-lg font-semibold text-slate-900">Hiring insights</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>You are receiving {analytics.proposalsPerJob.toFixed(1)} proposals per job on average. Improve quality by narrowing required skills.</li>
          <li>Completed delivery value is ₹{currency.format(analytics.completedSpending)}. Keep closing accepted jobs to improve delivery metrics.</li>
          <li>Your proposal response rate is {analytics.responseRate.toFixed(1)}%. Fast shortlisting usually improves hiring speed.</li>
        </ul>
      </motion.article>
    </section>
  );
}
