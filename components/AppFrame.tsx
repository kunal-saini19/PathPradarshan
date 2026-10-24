"use client";

import { RouteGate } from "@/components/RouteGate";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return <RouteGate>{children}</RouteGate>;
}
