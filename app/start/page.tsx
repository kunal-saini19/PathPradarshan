"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, Search, Trophy, UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { ActionCard } from "@/components/post-signup/ActionCard";

export default function PostSignupSelectionPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08),_transparent_50%),linear-gradient(160deg,#f8fcff_0%,#eef5ff_52%,#fbfff8_100%)] px-4 py-10">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      <main className="relative z-10 mx-auto w-full max-w-7xl pt-20">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 overflow-hidden rounded-2xl border border-surface-200/60 bg-white/80 p-7 text-center shadow-card-lg backdrop-blur-md md:p-10"
        >
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
            2Gathers
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-surface-900 md:text-5xl">
            Welcome to 2Gathers
          </h1>
          <p className="mt-3 text-base text-surface-500 md:text-lg">
            Choose your path to start your journey
          </p>
        </motion.header>

        <section className="grid gap-5 md:grid-cols-3">
          <ActionCard
            title="Work as Freelancer"
            description="Find jobs, build profile, and grow predictable monthly earnings with high-conversion proposals."
            buttonLabel="Start Working"
            icon={BriefcaseBusiness}
            accentClass="bg-gradient-to-br from-primary-100/60 via-transparent to-accent-100/30"
            onClick={() => router.push("/freelancer/dashboard")}
          />

          <ActionCard
            title="Hire Talent"
            description="Post jobs and hire skilled freelancers with strong ratings, fast response times, and proven delivery."
            buttonLabel="Hire Now"
            icon={UserRound}
            accentClass="bg-gradient-to-br from-success-100/60 via-transparent to-success-50/30"
            onClick={() => router.push("/client/dashboard")}
          />

          <ActionCard
            title="Explore Jobs"
            description="View all available jobs instantly and discover opportunities that match your skills and interests."
            buttonLabel="Browse Jobs"
            icon={Search}
            accentClass="bg-gradient-to-br from-accent-100/60 via-transparent to-primary-50/30"
            onClick={() => router.push("/jobs")}
          />
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-7"
        >
          <Link
            href="/leaderboard"
            className="group block w-full overflow-hidden rounded-2xl border border-warning-200/60 bg-gradient-to-r from-warning-50/80 via-white/90 to-warning-50/60 p-6 text-left shadow-card-md backdrop-blur-sm transition-all duration-300 hover:shadow-card-lg hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning-700">
                  Leaderboard
                </p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-surface-900">
                  Top Freelancers Leaderboard
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-surface-600">
                  See the best performers on the platform
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-100 to-warning-200/60 text-warning-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Trophy className="h-7 w-7" />
              </div>
            </div>
          </Link>
        </motion.section>
      </main>
    </div>
  );
}
