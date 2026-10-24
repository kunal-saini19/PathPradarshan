"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  delta?: string;
  positive?: boolean;
  icon?: LucideIcon;
};

export function StatCard({ label, value, helper, delta, positive = true, icon: Icon }: StatCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="relative overflow-hidden card-surface p-5"
    >
      {/* Subtle gradient accent on top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{value}</p>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {delta ? (
        <p
          className={`mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
            positive
              ? "bg-success-50 text-success-700"
              : "bg-danger-50 text-danger-700"
          }`}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta}
        </p>
      ) : null}
      {helper ? <p className="mt-2 text-sm text-surface-500">{helper}</p> : null}
    </motion.article>
  );
}
