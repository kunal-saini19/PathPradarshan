import { DashboardLayout } from "@/components/DashboardLayout";
import { mockTeam } from "@/lib/db";
import { Target, Users, Rocket } from "lucide-react";

const visionItems = [
  { icon: Target, label: "Mission", value: "Make freelance work easier to discover, apply to, and manage." },
  { icon: Users, label: "Team", value: "Design, product, and engineering focused on clarity and scale." },
  { icon: Rocket, label: "Future", value: "A foundation that can evolve into real blockchain payments later." },
];

export default function AboutPage() {
  return (
    <DashboardLayout
      title="About 2Gathers"
      subtitle="A focused freelancing platform prototype designed for stronger job matching, safer token flows, and a cleaner path to future blockchain support."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">Vision</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-surface-900">
            A sharper way to match talent and work
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-surface-500">
            2Gathers is built to feel serious, simple, and trustworthy. We aim to reduce friction between clients and freelancers by pairing
            AI recommendations with a token economy that rewards progress and makes premium access more intentional.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {visionItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-surface-50 p-4 ring-1 ring-surface-200/60">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-surface-600">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">Team</p>
          <div className="mt-4 space-y-3">
            {mockTeam.map((member) => {
              const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={member.name} className="rounded-xl border border-surface-200/60 bg-surface-50/50 p-4 transition-colors hover:bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{member.name}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary-600">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-surface-500">{member.bio}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
