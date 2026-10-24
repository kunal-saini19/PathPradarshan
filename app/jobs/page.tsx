"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Search, DollarSign, Users, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { jobsApi, savedJobsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";

type JobItem = {
  id: number;
  title: string;
  description: string;
  budget: number;
  applicationTokenCost?: number;
  clientId: number;
  createdAt: string;
  client: {
    id: number;
    username: string | null;
    name: string;
  };
  _count?: {
    proposals: number;
  };
};

export default function JobsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("500");
  const [status, setStatus] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await jobsApi.list();
      return (response.data?.jobs || []) as JobItem[];
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async () => {
      await jobsApi.create({
        title,
        description,
        budget: Number(budget),
      });
    },
    onSuccess: async () => {
      setStatus("Job posted successfully");
      setTitle("");
      setDescription("");
      setBudget("500");
      await jobsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to post job"),
  });

  const jobs = jobsQuery.data || [];

  const savedJobsQuery = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const response = await savedJobsApi.list();
      const saved = (response.data?.saved || []) as Array<{ jobId: number }>;
      return new Set(saved.map((item) => item.jobId));
    },
    enabled: Boolean(user),
  });

  const toggleSaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => savedJobsApi.toggle(jobId),
    onSuccess: async (response: any) => {
      const isSaved = Boolean(response?.data?.saved);
      setStatus(isSaved ? "Job saved" : "Job removed from saved list");
      await savedJobsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to save this job"),
  });

  function createJob() {
    if (title.trim().length < 3) {
      setStatus("Title must be at least 3 characters");
      return;
    }

    if (description.trim().length < 10) {
      setStatus("Description must be at least 10 characters");
      return;
    }

    const budgetValue = Number(budget);
    if (!Number.isInteger(budgetValue) || budgetValue <= 0) {
      setStatus("Budget must be a positive whole number");
      return;
    }

    createJobMutation.mutate();
  }

  return (
    <DashboardLayout title="Jobs" subtitle="Clients can post jobs, freelancers can browse them, and both can track proposal activity.">
      {user?.role === "CLIENT" ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface mb-6 space-y-4 p-6"
        >
          <h2 className="font-heading text-lg font-semibold text-surface-900">Post a new job</h2>
          <input className="input" placeholder="Job title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea
            className="input min-h-28 resize-y"
            placeholder="Describe scope, timeline, and expectations"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            className="input"
            placeholder="Budget"
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
          <button onClick={createJob} className="btn-primary btn-md" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? "Posting..." : "Post job"}
          </button>
        </motion.section>
      ) : (
        <section className="card-surface mb-6 p-6">
          <p className="text-sm text-surface-500">
            You are signed in as <span className="font-semibold text-surface-700">{user?.role || "GUEST"}</span>. Only CLIENT accounts can post jobs.
          </p>
        </section>
      )}

      {status ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm text-primary-700"
        >
          {status}
        </motion.div>
      ) : null}

      {/* Job Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job, index) => (
          <motion.article
            key={job.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card-md hover:-translate-y-0.5"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="font-heading text-lg font-bold text-surface-900 transition-colors group-hover:text-primary-700">
                {job.title}
              </h3>
              {user ? (
                <button
                  type="button"
                  className="flex-shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  onClick={() => toggleSaveJobMutation.mutate(job.id)}
                  disabled={toggleSaveJobMutation.isPending}
                >
                  {savedJobsQuery.data?.has(job.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
              ) : null}
            </div>

            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-surface-500">{job.description}</p>

            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1 font-semibold text-primary-700 ring-1 ring-primary-100">
                <DollarSign className="h-3 w-3" />
                {job.budget}
              </span>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Apply Fee: {job.applicationTokenCost ?? 0} TOK (~Rs {(job.applicationTokenCost ?? 0) * TOKEN_PRICE_INR})
              </span>
              <span className="rounded-lg bg-surface-50 px-3 py-1 font-semibold text-surface-600 ring-1 ring-surface-200/80">
                {job.client?.username || job.client?.name || "Unknown"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-50 px-3 py-1 font-semibold text-surface-600 ring-1 ring-surface-200/80">
                <Users className="h-3 w-3" />
                {job._count?.proposals || 0}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/jobs/${job.id}`} className="btn-primary btn-sm inline-flex items-center gap-1">
                View details <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search className="h-8 w-8" />
          </div>
          <p className="empty-state-title">No jobs posted yet</p>
          <p className="empty-state-description">Check back soon for new opportunities or post a job as a client.</p>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
