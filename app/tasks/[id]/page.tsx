"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Zap } from "lucide-react";
import { TaskEditor } from "@/components/TaskEditor";
import { cn } from "@/lib/utils";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  timeLimit?: number;
  functionName: string;
  starterCode: string;
  language: string;
  supportedLanguages: string[];
  testCases: { input: string; expectedOutput: string; description: string }[];
}

const difficultyColor = {
  BEGINNER: "bg-emerald-100 text-emerald-800",
  INTERMEDIATE: "bg-blue-100 text-blue-800",
  ADVANCED: "bg-amber-100 text-amber-800",
  EXPERT: "bg-red-100 text-red-800",
};

export default function TaskDetailPage({ params: paramsProm }: { params: Promise<{ id: string }> }) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");

  useEffect(() => {
    let isActive = true;

    paramsProm.then(({ id }) => {
      if (isActive) {
        setTaskId(id);
      }
    });

    return () => {
      isActive = false;
    };
  }, [paramsProm]);

  useEffect(() => {
    if (!taskId) return;
    fetchTask(taskId, selectedLanguage);
  }, [taskId, selectedLanguage]);

  async function fetchTask(id: string, language: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${id}?language=${encodeURIComponent(language)}`);
      const data = await response.json();

      if (data.success) {
        setTask(data.data);
        setSelectedLanguage(data.data.language);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Task not found</p>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/tasks"
          className="mb-6 inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 mb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
              <p className="mt-2 text-slate-600">{task.description}</p>
            </div>
            <span
              className={cn(
                "inline-block rounded px-3 py-1 text-sm font-semibold",
                difficultyColor[task.difficulty]
              )}
            >
              {task.difficulty}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1">
                {task.category}
              </span>
            </div>
            {task.timeLimit && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="h-4 w-4" />
                <span>{task.timeLimit} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-600">+{task.rewardTokens} tokens</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Test Cases */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Test Cases</h3>
                <div className="space-y-3">
                  {task.testCases.map((testCase, idx) => (
                    <div key={idx} className="rounded bg-slate-50 p-3 text-xs">
                      <p className="mb-1 font-medium text-slate-700">{testCase.description}</p>
                      <p className="text-slate-600">
                        Input: <span className="font-mono bg-white px-1">{testCase.input}</span>
                      </p>
                      <p className="text-slate-600">
                        Output: <span className="font-mono bg-white px-1">{testCase.expectedOutput}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">Tips</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Read the problem carefully</li>
                  <li>• Test with edge cases</li>
                  <li>• All tests must pass</li>
                  <li>• Earn tokens on success</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <TaskEditor
              taskId={task.id}
              starterCode={task.starterCode}
              language={task.language}
              supportedLanguages={task.supportedLanguages}
              onLanguageChange={setSelectedLanguage}
              timeLimit={task.timeLimit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
