"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle, RefreshCw } from "lucide-react";
import Editor from "@monaco-editor/react";
import { TestResults } from "./TestResults";
import { useAuth } from "@/context/AuthContext";

interface TaskEditorProps {
  taskId: string;
  starterCode: string;
  language: string;
  supportedLanguages: string[];
  onLanguageChange: (language: string) => void;
  timeLimit?: number;
}

interface SubmissionResponse {
  success: boolean;
  data?: {
    testResults: { test: string; passed: boolean; expected: string; actual: string }[];
    passedTests: number;
    totalTests: number;
    allPassed: boolean;
    tokensEarned: number;
    alreadyRewarded?: boolean;
    mode?: "run" | "submit";
    message: string;
  };
  error?: string;
}

export function TaskEditor({
  taskId,
  starterCode,
  language,
  supportedLanguages,
  onLanguageChange,
  timeLimit,
}: TaskEditorProps) {
  const { token } = useAuth();
  const [code, setCode] = useState(starterCode);
  const [runningTests, setRunningTests] = useState(false);
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [results, setResults] = useState<SubmissionResponse | null>(null);
  const [useFallbackEditor, setUseFallbackEditor] = useState(false);
  const monacoReadyRef = useRef(false);

  useEffect(() => {
    setCode(starterCode);
  }, [starterCode]);

  useEffect(() => {
    monacoReadyRef.current = false;
    setUseFallbackEditor(false);

    const timer = setTimeout(() => {
      if (!monacoReadyRef.current) {
        setUseFallbackEditor(true);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [language, starterCode]);

  const loading = runningTests || submittingSolution;

  async function submitAttempt(finalSubmit: boolean) {
    if (finalSubmit) {
      setSubmittingSolution(true);
    } else {
      setRunningTests(true);
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code, taskId, language, finalSubmit }),
      });

      const data: SubmissionResponse = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Submission failed",
      });
    } finally {
      if (finalSubmit) {
        setSubmittingSolution(false);
      } else {
        setRunningTests(false);
      }
    }
  }

  async function handleRunTests() {
    await submitAttempt(false);
  }

  async function handleFinalSubmit() {
    await submitAttempt(true);
  }

  function handleReset() {
    setCode(starterCode);
    setResults(null);
  }

  function handleLanguageChange(nextLanguage: string) {
    setResults(null);
    onLanguageChange(nextLanguage);
  }

  const monacoLanguageMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-900">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase">Language</span>
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              {supportedLanguages.map((supportedLanguage) => (
                <option key={supportedLanguage} value={supportedLanguage}>
                  {supportedLanguage}
                </option>
              ))}
            </select>
          </div>
          {timeLimit && <span className="text-xs text-slate-400">Time limit: {timeLimit} min</span>}
        </div>
        {useFallbackEditor ? (
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="h-[400px] w-full resize-none border-0 bg-slate-900 p-4 font-mono text-sm text-slate-100 outline-none"
            spellCheck={false}
          />
        ) : (
          <Editor
            height="400px"
            language={monacoLanguageMap[language] || "javascript"}
            value={code}
            onMount={() => {
              monacoReadyRef.current = true;
            }}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            loading={<div className="p-4 text-sm text-slate-300">Loading editor...</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleRunTests}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {runningTests ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Run Tests
            </>
          )}
        </button>
        <button
          onClick={handleFinalSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submittingSolution ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Submit Solution
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {results?.success && results.data && (
        <TestResults
          loading={loading}
          passedTests={results.data.passedTests}
          totalTests={results.data.totalTests}
          results={results.data.testResults}
          message={results.data.message}
          allPassed={results.data.allPassed}
        />
      )}

      {results?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Error</p>
          <p>{results.error}</p>
        </div>
      )}
    </div>
  );
}
