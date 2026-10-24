"use client";

import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FileText, DollarSign, Code2, CalendarDays, Check } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { jobsApi } from "@/lib/api";
import { calculateApplicationTokenCost, TOKEN_PRICE_INR } from "@/lib/tokenomics";

type JobFormState = {
  title: string;
  description: string;
  budget: string;
  skills: string;
  deadline: string;
};

const initialState: JobFormState = {
  title: "",
  description: "",
  budget: "",
  skills: "",
  deadline: "",
};

export default function ClientPostJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<JobFormState>(initialState);
  const [status, setStatus] = useState("");

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const budgetValue = Number(form.budget);
      const fullDescription = `${form.description.trim()}\n\nSkills Required: ${form.skills.trim()}\nDeadline: ${form.deadline}`;

      const response = await jobsApi.create({
        title: form.title.trim(),
        description: fullDescription,
        budget: budgetValue,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      const quote = data?.tokenQuote;
      if (quote?.tokenCost) {
        setStatus(`Job posted. Apply fee set to ${quote.tokenCost} TOK (~Rs ${quote.priceInr}).`);
      } else {
        setStatus("Job posted successfully.");
      }
      setForm(initialState);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err: any) => {
      setStatus(err?.response?.data?.detail || "Unable to post job right now.");
    },
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "CLIENT") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.budget.trim() || !form.skills.trim() || !form.deadline.trim()) {
      setStatus("Please complete all required fields before posting a job.");
      return;
    }

    const budgetValue = Number(form.budget);
    if (!Number.isInteger(budgetValue) || budgetValue <= 0) {
      setStatus("Budget must be a positive whole number.");
      return;
    }

    createJobMutation.mutate();
  }

  const budgetForQuote = Number(form.budget || "0");
  const fullDescriptionForQuote = `${form.description.trim()}\n\nSkills Required: ${form.skills.trim()}\nDeadline: ${form.deadline}`;
  const liveQuote = Number.isInteger(budgetForQuote) && budgetForQuote > 0
    ? calculateApplicationTokenCost({
        budgetInr: budgetForQuote,
        title: form.title.trim() || "Untitled",
        description: fullDescriptionForQuote,
        proposalCount: 0,
      })
    : null;

  return (
    <DashboardLayout title="Post a Job" subtitle="Publish a project brief with strong scope clarity to attract high-quality proposals faster.">
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="card-surface space-y-5 p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="label flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-surface-400" />
              Title *
            </span>
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Build a multi-tenant analytics dashboard"
            />
          </label>

          <label>
            <span className="label flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-surface-400" />
              Budget (₹) *
            </span>
            <input
              className="input"
              inputMode="numeric"
              value={form.budget}
              onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              placeholder="120000"
            />
          </label>

          <label className="md:col-span-2">
            <span className="label">Description *</span>
            <textarea
              className="input min-h-32 resize-y"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe scope, deliverables, milestones, and success criteria..."
            />
            <p className="mt-1 text-xs text-surface-400">
              {form.description.length} characters
            </p>
          </label>

          <label>
            <span className="label flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-surface-400" />
              Skills Required *
            </span>
            <input
              className="input"
              value={form.skills}
              onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
              placeholder="React, Node.js, TypeScript"
            />
          </label>

          <label>
            <span className="label flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-surface-400" />
              Deadline *
            </span>
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
            />
          </label>
        </div>

        {liveQuote ? (
          <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            <p className="font-semibold">Apply Fee Estimate</p>
            <p className="mt-1">{liveQuote.tokenCost} TOK (~Rs {liveQuote.priceInr}) at Rs {TOKEN_PRICE_INR} per token.</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-surface-100 pt-5">
          <button type="submit" className="btn-primary btn-md" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Submit Job
              </>
            )}
          </button>
          <button type="button" onClick={() => setForm(initialState)} className="btn-secondary btn-md" disabled={createJobMutation.isPending}>
            Reset
          </button>
        </div>

        {status ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm text-primary-700"
          >
            {status}
          </motion.p>
        ) : null}
      </motion.form>
    </DashboardLayout>
  );
}
