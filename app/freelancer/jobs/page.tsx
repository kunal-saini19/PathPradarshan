"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, Users, ChevronRight, Search, Briefcase } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { jobsApi } from "@/lib/api";

type AvailableJob = {
  id: number;
  title: string;
  description: string;
  budget: number;
  status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  client: {
    username: string | null;
    name: string;
  };
  _count?: {
    proposals: number;
  };
};

const statusConfig: Record<string, string> = {
  OPEN: "bg-success-50 text-success-700 ring-success-200",
  ACCEPTED: "bg-primary-50 text-primary-700 ring-primary-200",
  IN_PROGRESS: "bg-warning-50 text-warning-700 ring-warning-200",
  COMPLETED: "bg-surface-100 text-surface-600 ring-surface-200",
};

export default function FreelancerJobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const jobsQuery = useQuery({
    queryKey: ["freelancer-browse-jobs"],
    queryFn: async () => {
      const response = await jobsApi.list();
      return (response.data?.jobs || []) as AvailableJob[];
    },
    enabled: user?.role === "FREELANCER",
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "FREELANCER") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  return (
    <DashboardLayout title="Get Jobs" subtitle="Browse live client-posted jobs visible to every freelancer account.">
      {jobsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (jobsQuery.data || []).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase className="h-8 w-8" />
          </div>
          <p className="empty-state-title">No jobs available</p>
          <p className="empty-state-description">
            No client jobs posted yet. Check back soon for new opportunities.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(jobsQuery.data || []).map((job, index) => (
            <motion.article
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card-md hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-surface-900 transition-colors group-hover:text-primary-700">
                  {job.title}
                </h2>
                <span className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${statusConfig[job.status] || "bg-surface-100 text-surface-600"}`}>
                  {job.status}
                </span>
              </div>

              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-surface-500">{job.description}</p>

              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1 font-semibold text-primary-700 ring-1 ring-primary-100">
                  <DollarSign className="h-3 w-3" />
                  {job.budget}
                </span>
                <span className="rounded-lg bg-surface-50 px-3 py-1 font-semibold text-surface-600 ring-1 ring-surface-200/80">
                  {job.client?.username || job.client?.name || "Unknown"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-50 px-3 py-1 font-semibold text-surface-600 ring-1 ring-surface-200/80">
                  <Users className="h-3 w-3" />
                  {job._count?.proposals || 0}
                </span>
              </div>

              <Link
                href={`/jobs/${job.id}`}
                className="btn-primary btn-sm inline-flex items-center gap-1"
              >
                View & Apply <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
