import type { MockUser } from "@/lib/db";

export function ProfileCard({ user }: { user: MockUser }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-5 shadow-card-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
        Profile
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white shadow-md shadow-primary-500/20">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-xl font-semibold text-surface-900">
            {user.name}
          </h3>
          <p className="truncate text-sm text-surface-500">{user.headline}</p>
        </div>
        <span className="flex-shrink-0 rounded-lg bg-surface-900 px-3 py-1 text-xs font-semibold text-white">
          {user.role}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-surface-600">{user.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {user.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-lg bg-surface-50 px-2.5 py-1 text-xs font-medium text-surface-600 ring-1 ring-surface-200/80 transition-colors hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </aside>
  );
}
