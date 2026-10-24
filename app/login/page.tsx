import { Suspense } from "react";
import { AuthPanel } from "@/components/AuthPanel";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AuthPanel initialMode="login" />
    </Suspense>
  );
}