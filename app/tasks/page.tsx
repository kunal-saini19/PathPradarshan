"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Code2 } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface TaskData {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  testCasesCount: number;
}

const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const categories = ["Basic Math", "Logic", "String Manipulation", "Array Operations", "Algorithms", "General"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    fetchTasks();
  }, [difficulty, category]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (category) params.append("category", category);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDifficultyChange(value: string) {
    setDifficulty(value);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_50%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-surface-900">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 md:pt-28">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-surface-200/60 bg-white/80 p-6 shadow-card-sm backdrop-blur-sm md:p-8"
        >
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-accent-500 via-primary-500 to-accent-400" />
          <div className="pl-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">2Gathers</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight md:text-4xl">Coding Tasks</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-surface-500 md:text-base">
              Complete challenges and earn tokens. Perfect your coding skills!
            </p>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-surface-600">
              <Filter className="h-4 w-4" />
              Filters:
            </div>

            {/* Difficulty pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleDifficultyChange("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  difficulty === ""
                    ? "bg-surface-900 text-white shadow-sm"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
              >
                All Levels
              </button>
              {difficulties.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleDifficultyChange(level)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    difficulty === level
                      ? "bg-surface-900 text-white shadow-sm"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <span className="hidden h-5 w-px bg-surface-200 sm:inline-block" />

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCategoryChange("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === ""
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    category === cat
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Code2 className="h-8 w-8" />
            </div>
            <p className="empty-state-title">No tasks found</p>
            <p className="empty-state-description">Try adjusting your filters for more results.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
