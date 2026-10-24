"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const queryToken = query.get("token") || query.get("access_token") || "";
    if (queryToken) {
      setToken(queryToken);
      return;
    }

    const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash) {
      setToken("");
      return;
    }

    const hashParams = new URLSearchParams(hash);
    setToken(hashParams.get("access_token") || "");
  }, []);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(response.data?.message || "Email verified successfully.");
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.response?.data?.detail || "Verification failed. The token may be invalid or expired.");
      }
    }

    verify();
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Email verification</h1>
        <p className={`mt-4 text-sm ${status === "success" ? "text-emerald-700" : status === "error" ? "text-rose-700" : "text-slate-600"}`}>
          {message}
        </p>
        <div className="mt-6">
          <Link href="/login" className="btn-primary btn-md">
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
