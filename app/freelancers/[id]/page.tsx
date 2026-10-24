"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock3, ExternalLink, MapPin, Star } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { freelancerProfileApi, reviewsApi } from "@/lib/api";

type FreelancerProfileDetail = {
  id: number;
  username: string | null;
  name: string;
  role: string;
  tokens: number;
  freelancerProfile: {
    professionalTitle: string;
    bio: string;
    skills: string;
    experienceLevel: string;
    hourlyRateUsd: number;
    country: string;
    city: string;
    languages: string;
    portfolioUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    education: string | null;
    certifications: string | null;
    availability: string;
    responseTime: string;
  } | null;
  _count: {
    proposals: number;
    receivedReviews: number;
  };
  stats: {
    acceptedProposals: number;
    completedProjects: number;
    averageRating: number;
  };
};

type ReviewItem = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    username: string | null;
    name: string;
    role: string;
  };
};

function prettifyEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FreelancerProfilePage() {
  const params = useParams<{ id: string }>();
  const freelancerId = Number(params?.id || "0");

  const profileQuery = useQuery({
    queryKey: ["freelancer-profile-public", freelancerId],
    queryFn: async () => {
      const response = await freelancerProfileApi.byId(freelancerId);
      return response.data?.profile as FreelancerProfileDetail;
    },
    enabled: freelancerId > 0,
  });

  const reviewsQuery = useQuery({
    queryKey: ["freelancer-profile-reviews", freelancerId],
    queryFn: async () => {
      const response = await reviewsApi.listByTargetUser(freelancerId);
      return (response.data?.reviews || []) as ReviewItem[];
    },
    enabled: freelancerId > 0,
  });

  const profile = profileQuery.data;
  const details = profile?.freelancerProfile;

  return (
    <DashboardLayout
      title="Freelancer Profile"
      subtitle="Dynamic public profile view with role, skills, delivery stats, and client review history."
    >
      {profileQuery.isLoading ? (
        <div className="skeleton-card" />
      ) : !profile ? (
        <div className="empty-state">
          <p className="empty-state-title">Freelancer not found</p>
          <p className="empty-state-description">This profile may be unavailable.</p>
          <Link href="/freelancers" className="btn-primary btn-md mt-4">Back to freelancers</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Freelancer</p>
                <h1 className="mt-1 font-heading text-3xl font-bold text-surface-900">
                  {profile.username || profile.name}
                </h1>
                <p className="mt-2 text-surface-600">{details?.professionalTitle || "Freelancer"}</p>
              </div>
              <div className="rounded-xl bg-primary-50 px-4 py-2 text-right">
                <p className="text-xs text-primary-700">Hourly rate</p>
                <p className="font-heading text-2xl font-bold text-primary-800">
                  {details ? `$${details.hourlyRateUsd}/hr` : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-700">
                <MapPin className="h-3 w-3" />
                {details ? `${details.city}, ${details.country}` : "Location unavailable"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-700">
                <Briefcase className="h-3 w-3" />
                {details ? prettifyEnum(details.experienceLevel) : "Experience unavailable"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-700">
                <Clock3 className="h-3 w-3" />
                {details ? prettifyEnum(details.responseTime) : "Response time unavailable"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-surface-700">
                <Star className="h-3 w-3" />
                {profile.stats.averageRating.toFixed(1)} rating ({profile._count.receivedReviews} reviews)
              </span>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <article className="card-surface p-4">
              <p className="text-xs text-surface-500">Tokens</p>
              <p className="mt-1 font-heading text-2xl font-bold text-surface-900">{profile.tokens}</p>
            </article>
            <article className="card-surface p-4">
              <p className="text-xs text-surface-500">Accepted proposals</p>
              <p className="mt-1 font-heading text-2xl font-bold text-surface-900">{profile.stats.acceptedProposals}</p>
            </article>
            <article className="card-surface p-4">
              <p className="text-xs text-surface-500">Completed projects</p>
              <p className="mt-1 font-heading text-2xl font-bold text-surface-900">{profile.stats.completedProjects}</p>
            </article>
            <article className="card-surface p-4">
              <p className="text-xs text-surface-500">Total proposals</p>
              <p className="mt-1 font-heading text-2xl font-bold text-surface-900">{profile._count.proposals}</p>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <article className="card-surface p-5 lg:col-span-2">
              <h2 className="font-heading text-xl font-semibold text-surface-900">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-surface-600">
                {details?.bio || "No bio shared yet."}
              </p>

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-surface-500">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(details?.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).length > 0
                  ? (details?.skills || "")
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                      .map((skill) => (
                        <span key={skill} className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          {skill}
                        </span>
                      ))
                  : <p className="text-sm text-surface-500">No skills listed yet.</p>}
              </div>

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-surface-500">Languages</h3>
              <p className="mt-2 text-sm text-surface-600">{details?.languages || "Not specified"}</p>
            </article>

            <article className="card-surface p-5">
              <h2 className="font-heading text-lg font-semibold text-surface-900">Professional Details</h2>
              <div className="mt-3 space-y-2 text-sm text-surface-600">
                <p><span className="font-medium text-surface-800">Availability:</span> {details ? prettifyEnum(details.availability) : "N/A"}</p>
                <p><span className="font-medium text-surface-800">Education:</span> {details?.education || "Not provided"}</p>
                <p><span className="font-medium text-surface-800">Certifications:</span> {details?.certifications || "Not provided"}</p>
              </div>

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-surface-500">External Links</h3>
              <div className="mt-2 space-y-2">
                {details?.portfolioUrl ? <a href={details.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800"><ExternalLink className="h-3.5 w-3.5" /> Portfolio</a> : null}
                {details?.githubUrl ? <a href={details.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800"><ExternalLink className="h-3.5 w-3.5" /> GitHub</a> : null}
                {details?.linkedinUrl ? <a href={details.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800"><ExternalLink className="h-3.5 w-3.5" /> LinkedIn</a> : null}
                {!details?.portfolioUrl && !details?.githubUrl && !details?.linkedinUrl ? (
                  <p className="text-sm text-surface-500">No external links shared.</p>
                ) : null}
              </div>
            </article>
          </section>

          <section className="card-surface p-5">
            <h2 className="font-heading text-xl font-semibold text-surface-900">Client Reviews</h2>
            <div className="mt-4 space-y-3">
              {(reviewsQuery.data || []).length === 0 ? (
                <p className="text-sm text-surface-500">No reviews yet.</p>
              ) : (
                (reviewsQuery.data || []).slice(0, 8).map((review) => (
                  <article key={review.id} className="rounded-xl border border-surface-200/70 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-surface-900">{review.author.username || review.author.name}</p>
                      <p className="text-xs text-surface-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-1 text-sm text-warning-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    <p className="mt-2 text-sm text-surface-600">{review.comment}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
