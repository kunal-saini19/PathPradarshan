"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi, setToken as setApiToken } from "@/lib/api";

export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  tokens?: number;
  walletAddress?: string | null;
  hasFreelancerProfile?: boolean;
  hasClientProfile?: boolean;
}

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: { user: AuthUser; token: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = window.localStorage.getItem("twogathers_user");
    const rawToken = window.localStorage.getItem("twogathers_access");

    async function bootstrap() {
      if (rawUser && rawToken) {
        setUser(JSON.parse(rawUser));
      }
      if (rawToken) {
        setAccessToken(rawToken);
        setApiToken(rawToken);
      }

      try {
        if (rawToken && process.env.NODE_ENV !== "test") {
          const refreshed = await authApi.refresh();
          const nextToken = refreshed.data?.accessToken as string | undefined;
          const nextUser = refreshed.data?.user as AuthUser | undefined;
          if (nextToken && nextUser) {
            setAccessToken(nextToken);
            setApiToken(nextToken);
            setUser(nextUser);
            window.localStorage.setItem("twogathers_access", nextToken);
            window.localStorage.setItem("twogathers_user", JSON.stringify(nextUser));
          }
        }
      } catch {
        setUser(null);
        setAccessToken(null);
        setApiToken(null);
        window.localStorage.removeItem("twogathers_user");
        window.localStorage.removeItem("twogathers_access");
      } finally {
        if (!rawToken) {
          setUser(null);
          setAccessToken(null);
          setApiToken(null);
          window.localStorage.removeItem("twogathers_user");
          window.localStorage.removeItem("twogathers_access");
        }
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: ({ user: nextUser, token: nextToken }) => {
        setUser(nextUser);
        setAccessToken(nextToken);
        setApiToken(nextToken);
        window.localStorage.setItem("twogathers_user", JSON.stringify(nextUser));
        window.localStorage.setItem("twogathers_access", nextToken);
      },
      logout: () => {
        authApi.logout().catch(() => undefined);
        setUser(null);
        setAccessToken(null);
        setApiToken(null);
        window.localStorage.removeItem("twogathers_user");
        window.localStorage.removeItem("twogathers_access");
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
