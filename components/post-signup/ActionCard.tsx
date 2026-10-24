"use client";

import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";

type ActionCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  icon: LucideIcon;
  onClick: () => void;
  accentClass: string;
};

export function ActionCard({ title, description, buttonLabel, icon: Icon, onClick, accentClass }: ActionCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-surface-200/60 bg-white/90 p-6 shadow-card-md backdrop-blur-sm transition-shadow duration-300 hover:shadow-card-lg"
    >
      {/* Gradient background on hover */}
      <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accentClass}`} />

      <div className="relative z-10">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 text-surface-700 shadow-sm ring-1 ring-surface-200/80 transition-all duration-300 group-hover:shadow-md group-hover:ring-primary-200">
          <Icon className="h-7 w-7" />
        </div>

        <h3 className="font-heading text-2xl font-semibold text-surface-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">{description}</p>

        <button
          onClick={onClick}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-900 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-surface-800 active:scale-[0.98]"
        >
          {buttonLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.article>
  );
}
