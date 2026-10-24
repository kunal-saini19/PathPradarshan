"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { setToken } from "@/lib/api";

export function RouteGate({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setToken(token);
  }, [token]);

  useEffect(() => {
    if (loading) return;
    const isPublic = pathname === "/" || pathname === "/login" || pathname === "/register";
    const isSelectionPage = pathname === "/start";
    const isFreelancerOnboarding = pathname === "/onboarding/freelancer";
    const isClientOnboarding = pathname === "/onboarding/client";
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";

    if (!user && !isPublic) {
      router.replace("/");
      return;
    }

    if (user?.role === "FREELANCER" && !user?.hasFreelancerProfile && !isFreelancerOnboarding && !isSelectionPage) {
      router.replace("/onboarding/freelancer");
      return;
    }

    if (user?.role === "FREELANCER" && user?.hasFreelancerProfile && isFreelancerOnboarding && !isEditMode) {
      router.replace("/dashboard");
      return;
    }

    if (user?.role === "CLIENT" && !user?.hasClientProfile && !isClientOnboarding && !isSelectionPage) {
      router.replace("/onboarding/client");
      return;
    }

    if (user?.role === "CLIENT" && user?.hasClientProfile && isClientOnboarding && !isEditMode) {
      router.replace("/dashboard");
      return;
    }

    if (user && isPublic) {
      router.replace("/start");
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card-surface w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="font-medium text-slate-700">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
