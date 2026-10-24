"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Star } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { freelancersApi } from "@/lib/api";

type FreelancerListItem = {
  id: number;
  username: string | null;
  name: string;
  tokens: number;
  freelancerProfile: {
    professionalTitle: string;
    skills: string;
    experienceLevel: string;
    hourlyRateUsd: number;
    country: string;
    city: string;
  } | null;
  _count: {
    proposals: number;
    receivedReviews: number;
  };
};

export default function FreelancersDirectoryPage() {
  const freelancersQuery = useQuery({
    queryKey: ["freelancers-directory"],
    queryFn: async () => {
      const response = await freelancersApi.list();
      return (response.data?.freelancers || []) as FreelancerListItem[];
    },
  });

  return (
    <DashboardLayout
      title="Freelancers"
      subtitle="Browse real freelancer profiles with dynamic stats, skills, and verified review history."
    >
      {freelancersQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (freelancersQuery.data || []).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase className="h-8 w-8" />
          </div>
          <p className="empty-state-title">No freelancer profiles yet</p>
          <p className="empty-state-description">Ask freelancers to complete onboarding to appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(freelancersQuery.data || []).map((freelancer) => {
            const profile = freelancer.freelancerProfile;
            return (
              <article key={freelancer.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-surface-900">
                      {freelancer.username || freelancer.name}
                    </h2>
                    <p className="mt-1 text-sm text-surface-500">
                      {profile?.professionalTitle || "Freelancer"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {freelancer.tokens} tokens
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-600">
                    <MapPin className="h-3 w-3" />
                    {profile ? `${profile.city}, ${profile.country}` : "Location not set"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-600">
                    <Briefcase className="h-3 w-3" />
                    {profile ? `$${profile.hourlyRateUsd}/hr` : "Rate not set"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-600">
                    <Star className="h-3 w-3" />
                    {freelancer._count.receivedReviews} reviews
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-surface-600">
                  {profile?.skills || "Skills will appear after freelancer completes profile."}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-surface-500">{freelancer._count.proposals} proposals submitted</p>
                  <Link href={`/freelancers/${freelancer.id}`} className="btn-primary btn-sm">
                    View profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
