"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { clientProfileApi } from "@/lib/api";

type ClientProfile = {
  accountType: "INDIVIDUAL" | "COMPANY";
  displayName: string;
  companyName?: string | null;
  about: string;
  companySize: "SOLO" | "SMALL" | "MID" | "LARGE" | "ENTERPRISE";
  websiteUrl?: string | null;
  country: string;
  timezone: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  preferredLanguages: string;
  budgetRange: "UNDER_1K" | "ONE_TO_FIVE_K" | "FIVE_TO_TEN_K" | "TEN_PLUS";
  hiringGoals: string;
  communicationPreference: "CHAT_EMAIL" | "VIDEO_CALLS" | "FLEXIBLE";
  responseExpectation: "WITHIN_24H" | "WITHIN_3_DAYS" | "FLEXIBLE";
};

const defaultValues: ClientProfile = {
  accountType: "INDIVIDUAL",
  displayName: "",
  companyName: "",
  about: "",
  companySize: "SMALL",
  websiteUrl: "",
  country: "",
  timezone: "Asia/Kolkata",
  phone: "",
  linkedinUrl: "",
  preferredLanguages: "English",
  budgetRange: "ONE_TO_FIVE_K",
  hiringGoals: "",
  communicationPreference: "CHAT_EMAIL",
  responseExpectation: "WITHIN_24H",
};

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user, login, token } = useAuth();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<ClientProfile>(defaultValues);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([]);

  useEffect(() => {
    const options = new Set<string>();
    const formatter = new Intl.DisplayNames(["en"], { type: "region" });
    for (let first = 65; first <= 90; first += 1) {
      for (let second = 65; second <= 90; second += 1) {
        const code = `${String.fromCharCode(first)}${String.fromCharCode(second)}`;
        const name = formatter.of(code);
        if (name && name !== code) {
          options.add(name);
        }
      }
    }
    setCountryOptions([...options].sort((a, b) => a.localeCompare(b)));

    if (typeof Intl.supportedValuesOf === "function") {
      setTimezoneOptions(Intl.supportedValuesOf("timeZone"));
    } else {
      setTimezoneOptions(["UTC", "Asia/Kolkata", "Europe/London", "America/New_York"]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
    if (user.role !== "CLIENT") {
      router.replace("/dashboard");
      return;
    }
    if (user.hasClientProfile && !isEditMode) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const profileQuery = useQuery({
    queryKey: ["client-profile"],
    queryFn: async () => {
      const response = await clientProfileApi.me();
      return response.data?.profile as ClientProfile | null;
    },
    enabled: !!user && user.role === "CLIENT",
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        ...defaultValues,
        ...profileQuery.data,
      });
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await clientProfileApi.save({
        accountType: form.accountType,
        displayName: form.displayName,
        companyName: form.companyName ?? undefined,
        about: form.about,
        companySize: form.companySize,
        websiteUrl: form.websiteUrl ?? undefined,
        country: form.country,
        timezone: form.timezone,
        phone: form.phone ?? undefined,
        linkedinUrl: form.linkedinUrl ?? undefined,
        preferredLanguages: form.preferredLanguages,
        budgetRange: form.budgetRange,
        hiringGoals: form.hiringGoals,
        communicationPreference: form.communicationPreference,
        responseExpectation: form.responseExpectation,
      });
    },
    onSuccess: () => {
      setStatus("Client profile saved successfully");
      if (user && token) {
        login({
          user: {
            ...user,
            hasClientProfile: true,
          },
          token,
        });
      }
      router.push("/dashboard");
    },
    onError: (err: any) => {
      setStatus(err?.response?.data?.detail || "Unable to save client profile");
    },
  });

  function onChange<K extends keyof ClientProfile>(key: K, value: ClientProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    if (!form.displayName.trim() || !form.country.trim() || !form.timezone.trim()) {
      setStatus("Please complete all required profile fields");
      return;
    }
    if (form.accountType === "COMPANY" && !form.companyName?.trim()) {
      setStatus("Company name is required for company accounts");
      return;
    }
    if (form.about.trim().length < 80) {
      setStatus("About section must be at least 80 characters");
      return;
    }
    if (form.hiringGoals.trim().length < 40) {
      setStatus("Hiring goals must be at least 40 characters");
      return;
    }

    if (form.phone?.trim() && !/^\+[1-9]\d{1,3}[\s-]?\d{6,14}$/.test(form.phone.trim())) {
      setStatus("Phone number must start with country code like +91");
      return;
    }

    saveMutation.mutate();
  }

  return (
    <DashboardLayout title="Client profile setup" subtitle="Create a complete hiring profile so freelancers can trust your projects and proposals.">
      <section className="card-surface space-y-4 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Complete your client profile</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="label">Account type *</span>
            <select className="input" value={form.accountType} onChange={(event) => onChange("accountType", event.target.value as ClientProfile["accountType"])}>
              <option value="INDIVIDUAL">Individual client</option>
              <option value="COMPANY">Company</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Display name *</span>
            <input className="input" value={form.displayName} onChange={(event) => onChange("displayName", event.target.value)} placeholder="Kunal S. / Hiring at Acme" />
          </label>

          {form.accountType === "COMPANY" ? (
            <label className="block">
              <span className="label">Company name *</span>
              <input className="input" value={form.companyName || ""} onChange={(event) => onChange("companyName", event.target.value)} placeholder="Acme Labs" />
            </label>
          ) : null}

          <label className="block">
            <span className="label">Company size *</span>
            <select className="input" value={form.companySize} onChange={(event) => onChange("companySize", event.target.value as ClientProfile["companySize"])}>
              <option value="SOLO">Solo</option>
              <option value="SMALL">2-10</option>
              <option value="MID">11-50</option>
              <option value="LARGE">51-200</option>
              <option value="ENTERPRISE">200+</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Website</span>
            <input className="input" value={form.websiteUrl || ""} onChange={(event) => onChange("websiteUrl", event.target.value)} placeholder="https://company.com" />
          </label>

          <label className="block">
            <span className="label">Country *</span>
            <select className="input" value={form.country} onChange={(event) => onChange("country", event.target.value)}>
              <option value="">Select country</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Timezone *</span>
            <select className="input" value={form.timezone} onChange={(event) => onChange("timezone", event.target.value)}>
              <option value="">Select timezone</option>
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Phone</span>
            <input className="input" value={form.phone || ""} onChange={(event) => onChange("phone", event.target.value)} placeholder="+91 9876543210" />
          </label>

          <label className="block">
            <span className="label">LinkedIn URL</span>
            <input className="input" value={form.linkedinUrl || ""} onChange={(event) => onChange("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/..." />
          </label>

          <label className="block">
            <span className="label">Preferred languages *</span>
            <input className="input" value={form.preferredLanguages} onChange={(event) => onChange("preferredLanguages", event.target.value)} placeholder="English, Hindi" />
          </label>

          <label className="block">
            <span className="label">Budget range *</span>
            <select className="input" value={form.budgetRange} onChange={(event) => onChange("budgetRange", event.target.value as ClientProfile["budgetRange"])}>
              <option value="UNDER_1K">Under $1,000</option>
              <option value="ONE_TO_FIVE_K">$1,000 - $5,000</option>
              <option value="FIVE_TO_TEN_K">$5,000 - $10,000</option>
              <option value="TEN_PLUS">$10,000+</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Communication preference *</span>
            <select className="input" value={form.communicationPreference} onChange={(event) => onChange("communicationPreference", event.target.value as ClientProfile["communicationPreference"])}>
              <option value="CHAT_EMAIL">Chat + Email</option>
              <option value="VIDEO_CALLS">Video calls preferred</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Response expectation *</span>
            <select className="input" value={form.responseExpectation} onChange={(event) => onChange("responseExpectation", event.target.value as ClientProfile["responseExpectation"])}>
              <option value="WITHIN_24H">Within 24 hours</option>
              <option value="WITHIN_3_DAYS">Within 3 days</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="label">About your business * (min 80 chars)</span>
            <textarea
              className="input min-h-32 resize-y"
              value={form.about}
              onChange={(event) => onChange("about", event.target.value)}
              placeholder="Describe your business, products, and the type of outcomes you expect from freelancers."
            />
          </label>

          <label className="block md:col-span-2">
            <span className="label">Hiring goals * (min 40 chars)</span>
            <textarea
              className="input min-h-24 resize-y"
              value={form.hiringGoals}
              onChange={(event) => onChange("hiringGoals", event.target.value)}
              placeholder="What do you want to achieve in the next 3-6 months with freelancers?"
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
