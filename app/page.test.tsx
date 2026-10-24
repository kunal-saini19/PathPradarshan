import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/components/QueryProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("HomePage", () => {
  it("shows the landing page hero", () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </QueryProvider>
    );

    expect(screen.getByRole("heading", { name: /hire better/i })).toBeInTheDocument();
  });
});
