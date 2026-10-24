"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Lock, Mail, User, BriefcaseBusiness, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "At least 1 uppercase letter")
    .regex(/[a-z]/, "At least 1 lowercase letter")
    .regex(/[0-9]/, "At least 1 number")
    .regex(/[^A-Za-z0-9]/, "At least 1 special character"),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

type RegisterInput = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof loginSchema>;

type AuthPanelProps = {
  initialMode: "register" | "login";
};

export function AuthPanel({ initialMode }: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: (searchParams.get("role") as "CLIENT" | "FREELANCER" | null) ?? "CLIENT",
    },
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    registerForm.setValue("role", (searchParams.get("role") as "CLIENT" | "FREELANCER" | null) ?? "CLIENT");
  }, [registerForm, searchParams]);

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const response = await authApi.register(values);
      return response.data;
    },
    onSuccess: (payload) => {
      setRegisterSuccess(payload?.message || "Registration successful. Please verify your email before signing in.");
      setVerificationLink(payload?.verificationLink ?? null);
      setMode("login");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const response = await authApi.login(values);
      return response.data;
    },
    onSuccess: (payload) => {
      if (!payload?.accessToken || !payload?.user) {
        throw new Error("Unexpected auth response.");
      }
      login({ user: payload.user, token: payload.accessToken });
      router.push("/start");
    },
  });

  const activeMutation = mode === "register" ? registerMutation : loginMutation;
  const error = (activeMutation.error as any)?.response?.data?.detail || activeMutation.error?.message;
  const loading = activeMutation.isPending;
  const passwordValue = registerForm.watch("password") || "";
  const selectedRole = registerForm.watch("role");

  const passwordRules = [
    { label: "At least 8 characters", ok: passwordValue.length >= 8 },
    { label: "At least 1 uppercase letter", ok: /[A-Z]/.test(passwordValue) },
    { label: "At least 1 lowercase letter", ok: /[a-z]/.test(passwordValue) },
    { label: "At least 1 number", ok: /[0-9]/.test(passwordValue) },
    { label: "At least 1 special character", ok: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const passedRules = passwordRules.filter((r) => r.ok).length;
  const strengthPercent = (passedRules / passwordRules.length) * 100;
  const strengthColor =
    strengthPercent <= 20
      ? "bg-danger-500"
      : strengthPercent <= 60
        ? "bg-warning-500"
        : strengthPercent < 100
          ? "bg-primary-500"
          : "bg-success-500";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-surface-950 px-10 py-12 lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 dot-grid opacity-20" />
        {/* Floating gradient orbs */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary-600/20 blur-[100px] animate-float" />
        <div className="absolute -right-20 bottom-20 h-60 w-60 rounded-full bg-accent-600/15 blur-[80px] animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative z-10 max-w-xl">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-600/25">
              <span className="text-sm font-black text-white">2G</span>
            </div>
            <span className="text-lg font-bold text-white">2Gathers</span>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-700/50 bg-surface-800/30 px-4 py-1.5 text-xs font-medium text-surface-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
            {mode === "register" ? "Create your account" : "Welcome back"}
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-white lg:text-5xl">
            A cleaner path
            <br />
            <span className="gradient-text bg-gradient-to-r from-primary-400 to-accent-400">into the platform.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-surface-400">
            Join thousands of professionals who trust 2Gathers for their freelance workflow. Secure, structured, and designed for clarity.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Clear role selection for clients and freelancers",
              "Responsive forms with a consistent card surface",
              "Same structure as the marketing and dashboard views",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-surface-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-surface-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600">
              <span className="text-sm font-black text-white">2G</span>
            </div>
            <span className="font-bold text-surface-900">2Gathers</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-surface-200/60 bg-white p-7 shadow-card-lg"
          >
            <div className="mb-1 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-surface-900">
                  {mode === "register" ? "Create account" : "Sign in"}
                </h2>
                <p className="text-sm text-surface-500">
                  {mode === "register" ? "Start with a new profile" : "Access your existing account"}
                </p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl bg-surface-100 p-1">
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  mode === "register"
                    ? "bg-white text-surface-900 shadow-card-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  mode === "login"
                    ? "bg-white text-surface-900 shadow-card-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Sign in
              </button>
            </div>

            {registerSuccess ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-5 rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700"
              >
                <p>{registerSuccess}</p>
                {verificationLink ? (
                  <p className="mt-1 text-xs">
                    Dev link: <Link href={verificationLink} className="font-semibold underline">Verify email now</Link>
                  </p>
                ) : null}
              </motion.div>
            ) : null}

            {error ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-5 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700"
              >
                {error}
              </motion.p>
            ) : null}

            <AnimatePresence mode="wait">
              {mode === "register" ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
                  className="mt-5 space-y-4"
                >
                  <label className="block">
                    <span className="label">Username</span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input className="input pl-10" placeholder="Your username" {...registerForm.register("username")} required />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Email</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input className="input pl-10" type="email" placeholder="you@example.com" {...registerForm.register("email")} required />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input className="input pl-10" type="password" placeholder="Create a strong password" {...registerForm.register("password")} minLength={8} required />
                    </div>
                    {/* Password strength bar */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100">
                          <motion.div
                            className={`h-full rounded-full ${strengthColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${strengthPercent}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs font-medium text-surface-500">
                          {passedRules}/{passwordRules.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.label}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              rule.ok ? "text-success-600" : "text-surface-400"
                            }`}
                          >
                            {rule.ok ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>

                  {/* Role selector toggle cards */}
                  <div>
                    <span className="label">I want to</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => registerForm.setValue("role", "CLIENT")}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-200 ${
                          selectedRole === "CLIENT"
                            ? "border-primary-500 bg-primary-50 shadow-card-glow"
                            : "border-surface-200 bg-white hover:border-surface-300"
                        }`}
                      >
                        <Building2 className={`h-6 w-6 ${selectedRole === "CLIENT" ? "text-primary-600" : "text-surface-400"}`} />
                        <span className={`text-sm font-semibold ${selectedRole === "CLIENT" ? "text-primary-700" : "text-surface-700"}`}>
                          Hire talent
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => registerForm.setValue("role", "FREELANCER")}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-200 ${
                          selectedRole === "FREELANCER"
                            ? "border-primary-500 bg-primary-50 shadow-card-glow"
                            : "border-surface-200 bg-white hover:border-surface-300"
                        }`}
                      >
                        <BriefcaseBusiness className={`h-6 w-6 ${selectedRole === "FREELANCER" ? "text-primary-600" : "text-surface-400"}`} />
                        <span className={`text-sm font-semibold ${selectedRole === "FREELANCER" ? "text-primary-700" : "text-surface-700"}`}>
                          Find work
                        </span>
                      </button>
                    </div>
                  </div>

                  <button className="btn-primary btn-md w-full" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating account…
                      </span>
                    ) : (
                      <>
                        <span>Create account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}
                  className="mt-5 space-y-4"
                >
                  <label className="block">
                    <span className="label">Username</span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input className="input pl-10" placeholder="Username" {...loginForm.register("username")} required />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input className="input pl-10" type="password" placeholder="Password" {...loginForm.register("password")} minLength={8} required />
                    </div>
                  </label>

                  <button className="btn-primary btn-md w-full" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in…
                      </span>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-xs text-surface-500">
              {mode === "register" ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Need an account?{" "}
                  <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                    Create one
                  </Link>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}