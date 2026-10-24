"use client";

import { CheckCircle, XCircle, Loader } from "lucide-react";

interface TestResult {
  test: string;
  passed: boolean;
  expected: string;
  actual: string;
}

interface TestResultsProps {
  loading?: boolean;
  passedTests?: number;
  totalTests?: number;
  results?: TestResult[];
  message?: string;
  allPassed?: boolean;
}

export function TestResults({
  loading = false,
  passedTests = 0,
  totalTests = 0,
  results = [],
  message = "",
  allPassed = false,
}: TestResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Test Results</h3>
        {loading && <Loader className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {message && (
        <div
          className={`mb-4 rounded px-3 py-2 text-sm font-medium ${
            allPassed
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className="text-sm">
          <span className="font-semibold text-slate-900">{passedTests}</span>
          <span className="text-slate-600">/{totalTests} tests passed</span>
        </div>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalTests > 0 ? (passedTests / totalTests) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`rounded border p-3 ${
              result.passed
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="mb-2 flex items-start gap-2">
              {result.passed ? (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${result.passed ? "text-emerald-900" : "text-red-900"}`}>
                  {result.test}
                </p>
              </div>
            </div>

            {!result.passed && (
              <div className="space-y-1 text-xs">
                <div className="ml-6">
                  <p className="text-slate-600">
                    Expected: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{result.expected}</span>
                  </p>
                  <p className="text-slate-600">
                    Got: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{result.actual}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
