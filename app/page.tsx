"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, ChevronRight, Globe, Lock, Shield, Sparkles, Star, Zap } from "lucide-react";
import { motion, useInView } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { mockJobs } from "@/lib/db";

const features = [
  {
    icon: Sparkles,
    title: "AI-Driven Match Quality",
    description: "Shortlist faster with high-signal recommendations based on role fit, skills, and hiring intent.",
  },
  {
    icon: Shield,
    title: "Reliable Hiring Workflow",
    description: "From discovery to payout, every step is structured to reduce friction and improve confidence.",
  },
  {
    icon: Zap,
    title: "Token-Powered Actions",
    description: "Use a unified token system for premium applications, boosts, and wallet-based activity.",
  },
];

const roleTracks = [
  {
    icon: BriefcaseBusiness,
    title: "For Freelancers",
    points: ["Create a focused profile", "Get matched with relevant work", "Track earnings and wallet activity"],
    ctaLabel: "Start as Freelancer",
    href: "/register?role=FREELANCER",
  },
  {
    icon: Building2,
    title: "For Clients",
    points: ["Post clear project briefs", "Receive better-fit proposals", "Manage hiring from one dashboard"],
    ctaLabel: "Start as Client",
    href: "/register?role=CLIENT",
  },
];

const steps = [
  { n: "01", title: "Set Up in Minutes", body: "Choose your role and launch with a profile that communicates your value clearly." },
  { n: "02", title: "Move with Better Signal", body: "Match, review, and act on opportunities with less noise and faster decisions." },
  { n: "03", title: "Scale with Visibility", body: "Monitor projects, payouts, and platform outcomes from one professional workspace." },
];

const testimonials = [
  { name: "Alex Chen", role: "Full-stack freelancer", quote: "Proposal flow is cleaner, and I can focus on opportunities that truly match my profile." },
  { name: "Sarah Rodriguez", role: "Hiring manager", quote: "Our team moves faster because project posting and candidate review are in one structured flow." },
  { name: "Marcus Williams", role: "Startup founder", quote: "2Gathers feels production-ready. The product language and UI both communicate trust." },
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {target}{suffix}
    </motion.span>
  );
}

function StatItem({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="text-center"
    >
      <div className="font-heading text-3xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-1.5 text-sm text-surface-400">{label}</div>
    </motion.div>
  );
}

function getRoleHeroContent(role: "CLIENT" | "FREELANCER" | null) {
  if (role === "CLIENT") {
    return {
      badge: "Client-first workspace for professional hiring",
      headlineTop: "Hire with precision.",
      headlineAccent: "Deliver with confidence.",
      subtitle:
        "Post clear projects, review better-fit proposals, and manage hiring decisions from one structured dashboard.",
      primaryCtaHref: "/register?role=CLIENT",
      primaryCtaLabel: "Get Started as Client",
      secondaryCtaHref: "/client/post-job",
      secondaryCtaLabel: "Post a Job",
    };
  }

  if (role === "FREELANCER") {
    return {
      badge: "Freelancer-first workspace for focused growth",
      headlineTop: "Win better projects.",
      headlineAccent: "Grow with clarity.",
      subtitle:
        "Find role-fit opportunities faster, submit stronger proposals, and track your progress with less friction.",
      primaryCtaHref: "/register?role=FREELANCER",
      primaryCtaLabel: "Get Started as Freelancer",
      secondaryCtaHref: "/freelancer/jobs",
      secondaryCtaLabel: "Explore Matches",
    };
  }

  return {
    badge: "Professional freelance marketplace for modern teams",
    headlineTop: "Hire better.",
    headlineAccent: "Work smarter.",
    subtitle:
      "2Gathers helps freelancers and clients connect through a clearer workflow, stronger trust signals, and role-specific experiences.",
    primaryCtaHref: "/register",
    primaryCtaLabel: "Get Started",
    secondaryCtaHref: "/jobs",
    secondaryCtaLabel: "Browse Jobs",
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const [roleFromQuery, setRoleFromQuery] = useState<"CLIENT" | "FREELANCER" | null>(null);

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "CLIENT" || role === "FREELANCER") {
      setRoleFromQuery(role);
      return;
    }
    setRoleFromQuery(null);
  }, []);

  const scopedRole =
    user?.role === "CLIENT" || user?.role === "FREELANCER"
      ? user.role
      : roleFromQuery === "CLIENT" || roleFromQuery === "FREELANCER"
        ? roleFromQuery
        : null;

  const hero = getRoleHeroContent(scopedRole);

  return (
    <div className="min-h-screen bg-white text-surface-900">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen overflow-hidden bg-surface-950 pt-24">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        {/* Floating gradient orbs */}
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary-600/15 blur-[120px] animate-float" />
        <div className="absolute right-0 top-40 h-60 w-60 rounded-full bg-accent-500/10 blur-[100px] animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-24 pt-16 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-surface-700/50 bg-surface-800/30 px-4 py-1.5 text-xs font-medium text-surface-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
              {hero.badge}
            </div>

            <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
              {hero.headlineTop}
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">
                {hero.headlineAccent}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-400 md:text-xl">
              {hero.subtitle}
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={hero.primaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
              >
                {hero.primaryCtaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={hero.secondaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-700 bg-transparent px-8 py-3.5 text-base font-semibold text-surface-300 transition-all duration-200 hover:border-surface-500 hover:bg-surface-800 hover:text-white"
              >
                {hero.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-surface-500">
              {[
                { icon: Shield, label: "Secure workflow" },
                { icon: Lock, label: "Verified accounts" },
                { icon: Globe, label: "Built for remote teams" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-surface-500" />
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-semibold uppercase tracking-[0.14em] text-surface-600">
              <span>Studio North</span>
              <span>Orbit Works</span>
              <span>Northstar HR</span>
              <span>Inkwell Labs</span>
            </div>
          </motion.div>

          {/* Stats panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-6 rounded-2xl border border-surface-800/80 bg-surface-900/60 p-8 backdrop-blur-md md:grid-cols-4"
          >
            <StatItem value={`${mockJobs.length}+`} label="Live jobs" delay={0} />
            <StatItem value="95%" label="Match rate" delay={0.1} />
            <StatItem value="24/7" label="Platform access" delay={0.2} />
            <StatItem value="1 flow" label="Unified structure" delay={0.3} />
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="border-t border-surface-100 bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="mb-16 text-center">
            <p className="section-label">Platform capabilities</p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-surface-900">
              Everything feels closer together.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-surface-500">
              A single product system for discovery, hiring, proposals, and wallet operations.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-8 shadow-card-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card-md hover:-translate-y-0.5"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/40 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600 transition-all duration-300 group-hover:shadow-md group-hover:shadow-primary-500/15">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-surface-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-surface-500">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ROLE TRACKS ═══════ */}
      <section className="border-t border-surface-100 bg-surface-50/50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="mb-12 text-center">
            <p className="section-label">Role-based experience</p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-surface-900">
              Two paths. One professional platform.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {roleTracks.map((track, index) => (
              <motion.article
                key={track.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-8 shadow-card-sm transition-all duration-300 hover:shadow-card-md hover:-translate-y-0.5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600 shadow-sm">
                  <track.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 font-heading text-2xl font-semibold text-surface-900">{track.title}</h3>
                <ul className="mb-6 space-y-2.5 text-sm text-surface-600">
                  {track.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={track.href}
                  className="btn-primary btn-md group/btn inline-flex items-center gap-2"
                >
                  {track.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="border-t border-surface-100 bg-white py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="mb-16 text-center">
            <p className="section-label">How it works</p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-surface-900">
              Simple structure. Clear progression.
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.article
                key={step.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="relative"
              >
                <div className="mb-4 font-heading text-5xl font-black select-none bg-gradient-to-b from-surface-200 to-surface-100 bg-clip-text text-transparent">
                  {step.n}
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-surface-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-surface-500">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED JOBS ═══════ */}
      <section className="border-t border-surface-100 bg-surface-50/50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Trending jobs</p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900">Featured opportunities</h2>
            </div>
            <Link href="/jobs" className="hidden items-center gap-1.5 text-sm font-medium text-primary-600 transition hover:text-primary-700 md:flex">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mockJobs.slice(0, 3).map((job, index) => (
              <motion.article
                key={job.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card-md hover:-translate-y-0.5"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/40 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-4 flex items-start justify-between gap-4">
                  <span className="badge-slate">{job.status}</span>
                  <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{job.tokenCost} tokens</span>
                </div>
                <h3 className="mb-2 font-heading text-base font-semibold text-surface-900 transition-colors group-hover:text-primary-700">{job.title}</h3>
                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-surface-500">{job.description}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-lg bg-surface-50 px-2.5 py-1 text-xs font-medium text-surface-600 ring-1 ring-surface-200/80">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-surface-100 pt-4">
                  <span className="font-heading text-xl font-bold text-surface-900">{job.budget}</span>
                  <Link href="/register" className="flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:text-primary-700">
                    Apply <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="border-t border-surface-800 bg-surface-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="mb-14 text-center">
            <p className="section-label">Testimonials</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white">
              Designed to feel calm and professional.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.article
                key={item.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-2xl border border-surface-800/80 bg-surface-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-surface-700"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-warning-500 text-warning-500" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-surface-300 italic">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-surface-500">{item.role}</div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="border-t border-surface-100 bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-surface-900">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-500">
              Join as freelancer or client and move from sign-up to action with a clear, professional workflow.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl active:scale-[0.98]"
              >
                Create account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="btn-secondary btn-xl">Sign in</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-surface-500">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" />Fast setup</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" />Polished layout</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" />Responsive shell</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
