"use client";

import { useMemo } from "react";
import { getJobRecommendations } from "@/lib/ai";
import { mockJobs, mockUsers, type MockUser } from "@/lib/db";

export function useAIJobMatch(profile: MockUser | null, jobs = mockJobs) {
  return useMemo(() => {
    if (!profile) {
      return getJobRecommendations(mockUsers[0], jobs);
    }

    return getJobRecommendations(profile, jobs);
  }, [jobs, profile]);
}
