"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { freelancerProfileApi } from "@/lib/api";

type FreelancerProfile = {
  professionalTitle: string;
  bio: string;
  skills: string;
  experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  hourlyRateUsd: number;
  country: string;
  city: string;
  phone?: string | null;
  languages: string;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  education?: string | null;
  certifications?: string | null;
  availability: "FULL_TIME" | "PART_TIME" | "AS_NEEDED";
  preferredWorkingHours?: string | null;
  responseTime: "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_2_DAYS";
};

const defaultValues: FreelancerProfile = {
  professionalTitle: "",
  bio: "",
  skills: "",
  experienceLevel: "INTERMEDIATE",
  hourlyRateUsd: 25,
  country: "",
  city: "",
  phone: "",
  languages: "English",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  education: "",
  certifications: "",
  availability: "PART_TIME",
  preferredWorkingHours: "",
  responseTime: "WITHIN_DAY",
};

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user, login, token } = useAuth();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<FreelancerProfile>(defaultValues);

  useEffect(() => {
    if (!user) return;
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
    if (user.role !== "FREELANCER") {
      router.replace("/dashboard");
      return;
    }
    if (user.hasFreelancerProfile && !isEditMode) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const profileQuery = useQuery({
    queryKey: ["freelancer-profile"],
    queryFn: async () => {
      const response = await freelancerProfileApi.me();
      return response.data?.profile as FreelancerProfile | null;
    },
    enabled: !!user && user.role === "FREELANCER",
  });

  useEffect(() => {
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
    if (profileQuery.data && !isEditMode) {
      router.replace("/dashboard");
      return;
    }
    if (profileQuery.data) {
      setForm({
        ...defaultValues,
        ...profileQuery.data,
      });
    }
  }, [profileQuery.data, router]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await freelancerProfileApi.save({
        professionalTitle: form.professionalTitle,
        bio: form.bio,
        skills: form.skills,
        experienceLevel: form.experienceLevel,
        hourlyRateUsd: Number(form.hourlyRateUsd),
        country: form.country,
        city: form.city,
        phone: form.phone ?? undefined,
        languages: form.languages,
        portfolioUrl: form.portfolioUrl ?? undefined,
        githubUrl: form.githubUrl ?? undefined,
        linkedinUrl: form.linkedinUrl ?? undefined,
        education: form.education ?? undefined,
        certifications: form.certifications ?? undefined,
        availability: form.availability,
        preferredWorkingHours: form.preferredWorkingHours ?? undefined,
        responseTime: form.responseTime,
      });
    },
    onSuccess: () => {
      setStatus("Freelancer profile saved successfully");
      if (user && token) {
        login({
          user: {
            ...user,
            hasFreelancerProfile: true,
          },
          token,
        });
      }
      router.push("/dashboard");
    },
    onError: (err: any) => {
      setStatus(err?.response?.data?.detail || "Unable to save freelancer profile");
    },
  });

  function onChange<K extends keyof FreelancerProfile>(key: K, value: FreelancerProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    if (!form.professionalTitle.trim() || !form.bio.trim() || !form.skills.trim() || !form.country.trim() || !form.city.trim()) {
      setStatus("Please complete all required profile fields");
      return;
    }
    if (form.bio.trim().length < 80) {
      setStatus("Bio must be at least 80 characters");
      return;
    }
    if (!Number.isFinite(Number(form.hourlyRateUsd)) || Number(form.hourlyRateUsd) <= 0) {
      setStatus("Hourly rate must be a positive number");
      return;
    }

    saveMutation.mutate();
  }

  return (
    <DashboardLayout title="Freelancer profile setup" subtitle="Tell clients who you are, what you do, and how you prefer to work.">
      <section className="card-surface space-y-4 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Complete your freelancer profile</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="label">Professional title *</span>
            <input className="input" value={form.professionalTitle} onChange={(event) => onChange("professionalTitle", event.target.value)} placeholder="Full-stack developer | React, Node.js" />
          </label>

          <label className="block">
            <span className="label">Skills *</span>
            <input className="input" value={form.skills} onChange={(event) => onChange("skills", event.target.value)} placeholder="React, Node.js, TypeScript, API integration" />
          </label>

          <label className="block">
            <span className="label">Experience level *</span>
            <select className="input" value={form.experienceLevel} onChange={(event) => onChange("experienceLevel", event.target.value as FreelancerProfile["experienceLevel"])}>
              <option value="ENTRY">Entry level</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Hourly rate (USD) *</span>
            <input
              className="input"
              inputMode="numeric"
              value={String(form.hourlyRateUsd)}
              onChange={(event) => onChange("hourlyRateUsd", Number(event.target.value) as FreelancerProfile["hourlyRateUsd"])}
              placeholder="25"
            />
          </label>

          <label className="block">
            <span className="label">Country *</span>
            <input className="input" value={form.country} onChange={(event) => onChange("country", event.target.value)} placeholder="India" />
          </label>

          <label className="block">
            <span className="label">City *</span>
            <input className="input" value={form.city} onChange={(event) => onChange("city", event.target.value)} placeholder="Delhi" />
          </label>

          <label className="block">
            <span className="label">Languages *</span>
            <input className="input" value={form.languages} onChange={(event) => onChange("languages", event.target.value)} placeholder="English, Hindi" />
          </label>

          <label className="block">
            <span className="label">Phone</span>
            <input className="input" value={form.phone || ""} onChange={(event) => onChange("phone", event.target.value)} placeholder="+91 ..." />
          </label>

          <label className="block">
            <span className="label">Portfolio URL</span>
            <input className="input" value={form.portfolioUrl || ""} onChange={(event) => onChange("portfolioUrl", event.target.value)} placeholder="https://..." />
          </label>

          <label className="block">
            <span className="label">GitHub URL</span>
            <input className="input" value={form.githubUrl || ""} onChange={(event) => onChange("githubUrl", event.target.value)} placeholder="https://github.com/..." />
          </label>

          <label className="block">
            <span className="label">LinkedIn URL</span>
            <input className="input" value={form.linkedinUrl || ""} onChange={(event) => onChange("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/..." />
          </label>

          <label className="block">
            <span className="label">Availability *</span>
            <select className="input" value={form.availability} onChange={(event) => onChange("availability", event.target.value as FreelancerProfile["availability"])}>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="AS_NEEDED">As needed</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="label">Preferred working hours</span>
            <input className="input" value={form.preferredWorkingHours || ""} onChange={(event) => onChange("preferredWorkingHours", event.target.value)} placeholder="Mon-Fri, 10AM-6PM IST" />
          </label>

          <label className="block">
            <span className="label">Response time *</span>
            <select className="input" value={form.responseTime} onChange={(event) => onChange("responseTime", event.target.value as FreelancerProfile["responseTime"])}>
              <option value="WITHIN_HOUR">Within 1 hour</option>
              <option value="WITHIN_DAY">Within 24 hours</option>
              <option value="WITHIN_2_DAYS">Within 2 days</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="label">Education</span>
            <input className="input" value={form.education || ""} onChange={(event) => onChange("education", event.target.value)} placeholder="B.Tech in Computer Science, ..." />
          </label>

          <label className="block md:col-span-2">
            <span className="label">Certifications</span>
            <input className="input" value={form.certifications || ""} onChange={(event) => onChange("certifications", event.target.value)} placeholder="AWS, Google, Scrum, ..." />
          </label>

          <label className="block md:col-span-2">
            <span className="label">Professional bio * (min 80 chars)</span>
            <textarea
              className="input min-h-32 resize-y"
              value={form.bio}
              onChange={(event) => onChange("bio", event.target.value)}
              placeholder="Introduce your experience, specializations, and what outcomes you deliver for clients."
            />
          </label>
        </div>

        <button type="button" onClick={onSubmit} className="btn-primary btn-md" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving profile..." : "Save profile and continue"}
        </button>

        {status ? <p className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{status}</p> : null}
      </section>
    </DashboardLayout>
  );
}
