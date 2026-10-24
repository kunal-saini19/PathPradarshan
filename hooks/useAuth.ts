"use client";

import { useEffect, useMemo, useState } from "react";
import { getMockUser, mockUsers, type MockUser } from "@/lib/db";

const STORAGE_KEY = "twogathers.session";

export type AuthSession = {
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
};

export function useAuth(): AuthSession {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MockUser;
      setUser(parsed);
      return;
    }

    setUser(mockUsers[0]);
  }, []);

  const value = useMemo<AuthSession>(() => ({
    user,
    isAuthenticated: Boolean(user),
    login: (userId: string) => {
      const nextUser = getMockUser(userId);
      setUser(nextUser);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    },
    logout: () => {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [user]);

  return value;
}
