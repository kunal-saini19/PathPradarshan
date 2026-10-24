import { describe, expect, it, vi } from "vitest";
import { issueAccessToken, parseAccessToken } from "@/lib/auth";

describe("local access tokens", () => {
  it("accepts a signed token for its intended user", () => {
    const token = issueAccessToken(42);
    expect(parseAccessToken(token)).toBe(42);
  });

  it("rejects forged or malformed tokens", () => {
    const token = issueAccessToken(42);
    expect(parseAccessToken(token.replace("42.", "43."))).toBeNull();
    expect(parseAccessToken("local.42")).toBeNull();
    expect(parseAccessToken("local.0.9999999999.invalid")).toBeNull();
  });

  it("rejects expired tokens", () => {
    const now = new Date("2026-10-23T00:00:00.000Z");
    vi.setSystemTime(now);
    const token = issueAccessToken(42);
    vi.setSystemTime(new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000));
    expect(parseAccessToken(token)).toBeNull();
    vi.useRealTimers();
  });
});