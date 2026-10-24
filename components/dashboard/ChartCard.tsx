"use client";

import { motion } from "framer-motion";

type ChartCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden card-surface p-5"
    >
      {/* Subtle top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500/0 via-accent-500/30 to-primary-500/0" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-surface-900">{title}</h3>
          <p className="text-sm text-surface-500">{subtitle}</p>
        </div>
      </div>
      <div className="h-[260px] w-full overflow-hidden">{children}</div>
    </motion.section>
  );
}
