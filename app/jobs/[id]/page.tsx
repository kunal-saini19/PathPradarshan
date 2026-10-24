"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { jobsApi, proposalsApi, reviewsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";

type JobDetails = {
  id: number;
  title: string;
  description: string;
  budget: number;
  applicationTokenCost?: number;
  status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  clientId: number;
  hiredFreelancerId?: number | null;
  client: {
    id: number;
    username: string | null;
    name: string;
  };
  _count?: {
    proposals: number;
  };
};

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [ratingInput, setRatingInput] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [status, setStatus] = useState("");

  const jobId = Number(params.id || "0");

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const response = await jobsApi.byId(jobId);
      return response.data?.job as JobDetails;
    },
    enabled: Number.isInteger(jobId) && jobId > 0,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await proposalsApi.create({
        jobId,
        coverLetter,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      const debit = data?.tokenDebit;
      if (debit?.txHash) {
        setStatus(
          `Applied successfully. Debited ${debit.tokenCost} TOK (Rs ${debit.totalInr}). Tx ${debit.txHash.slice(0, 14)}... | Remaining ${debit.remainingTokens} TOK`,
        );
      } else {
        setStatus("Application submitted successfully");
      }
      setCoverLetter("");
      void jobQuery.refetch();
    },
    onError: (err: any) => {
      setStatus(err?.response?.data?.detail || "Unable to apply to this job");
    },
  });

  const completeProjectMutation = useMutation({
    mutationFn: async () => jobsApi.complete(jobId),
    onSuccess: async () => {
      setStatus("Project marked as completed. Reviews are now enabled.");
      await jobQuery.refetch();
      await reviewsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to complete this project"),
  });

  const reviewsQuery = useQuery({
    queryKey: ["job-reviews", jobId],
    queryFn: async () => {
      const response = await reviewsApi.listByJob(jobId);
      return response.data?.reviews || [];
    },
    enabled: Number.isInteger(jobId) && jobId > 0,
  });

  const createReviewMutation = useMutation({
    mutationFn: async () =>
      reviewsApi.create({
        jobId,
        rating: Number(ratingInput),
        comment: reviewComment,
      }),
    onSuccess: async () => {
      setStatus("Review submitted");
      setReviewComment("");
      setRatingInput("5");
      await reviewsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to submit review"),
  });

  const job = jobQuery.data;
  const reviews = reviewsQuery.data || [];

  const isProjectParticipant = Boolean(
    job && user && (Number(user.id) === job.clientId || Number(user.id) === Number(job.hiredFreelancerId || 0)),
  );

  const canSubmitReview = Boolean(job && user && job.status === "COMPLETED" && isProjectParticipant);

  function applyToJob() {
    if (!coverLetter.trim()) {
      setStatus("Please write a cover letter before submitting");
      return;
    }

    applyMutation.mutate();
  }

  return (
    <DashboardLayout title="Job details" subtitle="Review full scope and submit your proposal with a cover letter.">
      {!job ? (
        <section className="card-surface p-6 text-sm text-slate-500">Loading job details...</section>
      ) : (
        <section className="card-surface space-y-5 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{job.title}</h2>
            <p className="mt-2 text-sm text-slate-500">Client: {job.client?.username || job.client?.name || "Unknown"}</p>
          </div>

          <p className="text-slate-700">{job.description}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700">Budget: {job.budget}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              Apply Fee: {job.applicationTokenCost ?? 0} TOK (~Rs {(job.applicationTokenCost ?? 0) * TOKEN_PRICE_INR})
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Proposals: {job._count?.proposals || 0}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Status: {job.status}</span>
          </div>

          {user?.role === "CLIENT" && Number(user.id) === job.clientId && ["ACCEPTED", "IN_PROGRESS"].includes(job.status) ? (
            <div>
              <button
                type="button"
                onClick={() => completeProjectMutation.mutate()}
                className="btn-secondary btn-md"
                disabled={completeProjectMutation.isPending}
              >
                {completeProjectMutation.isPending ? "Completing..." : "Mark project completed"}
              </button>
            </div>
          ) : null}

          {user?.role === "FREELANCER" ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Apply to this job</h3>
              <textarea
                className="input min-h-28 resize-y"
                placeholder="Write your cover letter"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
              <button type="button" onClick={applyToJob} className="btn-primary btn-md" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Submitting..." : `Apply (${job.applicationTokenCost ?? 0} TOK)`}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Only freelancers can apply to jobs.</p>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Ratings & reviews</h3>
            {reviews.length ? (
              <div className="space-y-2">
                {reviews.map((review: any) => (
                  <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {review.author?.username || review.author?.name} rated {review.rating}/5
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No reviews yet.</p>
            )}

            {canSubmitReview ? (
              <div className="space-y-2">
                <div className="grid gap-2 md:grid-cols-[140px_1fr]">
                  <select className="input" value={ratingInput} onChange={(event) => setRatingInput(event.target.value)}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={String(value)}>
                        {value} stars
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Share your project experience"
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary btn-md"
                  onClick={() => createReviewMutation.mutate()}
                  disabled={createReviewMutation.isPending}
                >
                  {createReviewMutation.isPending ? "Submitting..." : "Submit review"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Reviews unlock after the project is completed.</p>
            )}
          </div>
        </section>
      )}

      {status ? <p className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{status}</p> : null}
    </DashboardLayout>
  );
}
