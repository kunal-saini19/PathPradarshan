import { type JobRecommendation } from "@/lib/ai";

export function JobCard({ job }: { job: JobRecommendation }) {
  const scoreColor =
    job.score >= 90
      ? "text-success-600 bg-success-50 ring-success-200"
      : job.score >= 70
        ? "text-primary-600 bg-primary-50 ring-primary-200"
        : "text-surface-600 bg-surface-100 ring-surface-200";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-5 shadow-card-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card-md hover:-translate-y-0.5">
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/40 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-surface-400">
            {job.client}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-surface-900 transition-colors group-hover:text-primary-700">
            {job.title}
          </h3>
        </div>
        {/* Match score ring */}
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ring-2 ${scoreColor}`}>
          <span className="text-sm font-bold">{job.score}%</span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-surface-600 line-clamp-2">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg bg-surface-50 px-2.5 py-1 text-xs font-medium text-surface-600 ring-1 ring-surface-200/80"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4 text-sm">
        <span className="font-semibold text-surface-900">Budget {job.budget}</span>
        <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
          {job.tokenCost} tokens
        </span>
      </div>
    </article>
  );
}
