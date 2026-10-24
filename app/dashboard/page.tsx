"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins, Briefcase, Search, MessageSquare, Wallet, Code2, Plus, Bell, CheckCheck, Compass,
  BookmarkCheck, UserMinus, Eye
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  adminApi,
  authApi,
  clientProfileApi,
  freelancerProfileApi,
  jobsApi,
  notificationsApi,
  proposalsApi,
  savedFreelancersApi,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const FreelancerAnalytics = dynamic(() => import("@/features/dashboard/components/FreelancerAnalytics").then((mod) => mod.FreelancerAnalytics), {
  ssr: false,
  loading: () => <div className="mt-6 skeleton-card" />,
});

const ClientAnalytics = dynamic(() => import("@/features/dashboard/components/ClientAnalytics").then((mod) => mod.ClientAnalytics), {
  ssr: false,
  loading: () => <div className="mt-6 skeleton-card" />,
});

type JobListItem = {
  id: number;
  title: string;
  clientId: number;
  _count?: {
    proposals: number;
  };
};

type ProposalItem = {
  id: number;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  coverLetter: string;
  createdAt: string;
  job?: {
    id: number;
    title: string;
    budget?: number;
    status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
    client?: {
      id: number;
      username: string | null;
      name: string;
      email: string;
    };
  };
  freelancer: {
    id: number;
    username: string | null;
    name: string;
    email: string;
    walletAddress?: string | null;
  };
};

type AdminOverview = {
  counts: {
    users: number;
    jobs: number;
    proposals: number;
  };
  users: Array<{
    id: number;
    username: string | null;
    name: string;
    email: string;
    role: string;
    tokens: number;
  }>;
  jobs: Array<{
    id: number;
    title: string;
    budget: number;
    createdAt: string;
    client: {
      id: number;
      username: string | null;
      name: string;
      email: string;
    };
    _count: {
      proposals: number;
    };
  }>;
  proposals: Array<{
    id: number;
    coverLetter: string;
    createdAt: string;
    job: {
      id: number;
      title: string;
    };
    freelancer: {
      id: number;
      username: string | null;
      name: string;
      email: string;
    };
  }>;
};

type FreelancerProfileSummary = {
  professionalTitle: string;
  skills: string;
  experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  hourlyRateUsd: number;
  country: string;
  city: string;
};

type ClientProfileSummary = {
  accountType: "INDIVIDUAL" | "COMPANY";
  displayName: string;
  companyName?: string | null;
  budgetRange: "UNDER_1K" | "ONE_TO_FIVE_K" | "FIVE_TO_TEN_K" | "TEN_PLUS";
  country: string;
  timezone: string;
  phone?: string | null;
};

const proposalStatusConfig: Record<string, string> = {
  ACCEPTED: "bg-success-50 text-success-700 ring-success-200",
  SHORTLISTED: "bg-warning-50 text-warning-700 ring-warning-200",
  REJECTED: "bg-danger-50 text-danger-700 ring-danger-200",
  SUBMITTED: "bg-surface-100 text-surface-700 ring-surface-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalIdFromQuery = Number(searchParams.get("proposalId") || "0");
  const { user } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState(0);
  const [proposalStatusFilter, setProposalStatusFilter] = useState<"ALL" | "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED">("ALL");
  const [clientViewTab, setClientViewTab] = useState<"proposals" | "saved">("proposals");
  const [proposalActionStatus, setProposalActionStatus] = useState("");
  const [proposalStatusOverrides, setProposalStatusOverrides] = useState<Record<number, "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED">>({});
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await authApi.dashboard();
      return response.data;
    },
  });

  const dashboard = dashboardQuery.data;
  const currentUserId = Number(user?.id || "0");

  const myJobsQuery = useQuery({
    queryKey: ["client-jobs", currentUserId],
    queryFn: async () => {
      const response = await jobsApi.list();
      const allJobs = (response.data?.jobs as JobListItem[]) || [];
      return allJobs.filter((job) => job.clientId === currentUserId);
    },
    enabled: user?.role === "CLIENT" && currentUserId > 0,
  });

  useEffect(() => {
    if (!selectedJobId && myJobsQuery.data?.length) {
      setSelectedJobId(myJobsQuery.data[0].id);
    }
  }, [myJobsQuery.data, selectedJobId]);

  const proposalsQuery = useQuery({
    queryKey: ["client-proposals", currentUserId],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals as ProposalItem[]) || [];
    },
    enabled: user?.role === "CLIENT" && currentUserId > 0,
    refetchInterval: 5000,
  });

  const freelancerAppliedJobsQuery = useQuery({
    queryKey: ["freelancer-applied-jobs", currentUserId],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals as ProposalItem[]) || [];
    },
    enabled: user?.role === "FREELANCER" && currentUserId > 0,
    refetchInterval: 7000,
  });

  const savedFreelancersQuery = useQuery({
    queryKey: ["saved-freelancers", currentUserId],
    queryFn: async () => {
      const response = await savedFreelancersApi.list();
      return (response.data?.saved || []) as Array<{
        id: number;
        freelancer: {
          id: number;
          username: string | null;
          name: string;
          email: string;
          role: string;
        };
      }>;
    },
    enabled: user?.role === "CLIENT" && currentUserId > 0,
    refetchInterval: 8000,
  });

  const proposalCountsByJob = (proposalsQuery.data || []).reduce<Record<number, number>>((counts, proposal) => {
    if (!proposal.job?.id) return counts;
    counts[proposal.job.id] = (counts[proposal.job.id] || 0) + 1;
    return counts;
  }, {});

  const visibleClientProposals = (proposalsQuery.data || []).filter((proposal) => {
    const matchesJob = selectedJobId > 0 ? proposal.job?.id === selectedJobId : true;
    const displayedStatus = proposalStatusOverrides[proposal.id] || proposal.status;
    const matchesStatus = proposalStatusFilter === "ALL" ? true : displayedStatus === proposalStatusFilter;
    return matchesJob && matchesStatus;
  });

  const getDisplayedProposalStatus = (proposal: ProposalItem) => proposalStatusOverrides[proposal.id] || proposal.status;

  useEffect(() => {
    if (user?.role !== "CLIENT") return;
    if (!myJobsQuery.data?.length || !proposalsQuery.data?.length) return;

    if (!selectedJobId) {
      const firstJobWithProposals = myJobsQuery.data.find((job) =>
        proposalsQuery.data?.some((proposal) => proposal.job?.id === job.id),
      );

      if (firstJobWithProposals) {
        setSelectedJobId(firstJobWithProposals.id);
        return;
      }
    }

    const selectedHasProposals = proposalsQuery.data.some((proposal) => proposal.job?.id === selectedJobId);
    if (selectedHasProposals) return;

    const firstJobWithProposals = myJobsQuery.data.find((job) =>
      proposalsQuery.data?.some((proposal) => proposal.job?.id === job.id),
    );

    if (firstJobWithProposals && firstJobWithProposals.id !== selectedJobId) {
      setSelectedJobId(firstJobWithProposals.id);
    }
  }, [myJobsQuery.data, proposalsQuery.data, selectedJobId, user?.role]);

  useEffect(() => {
    if (user?.role !== "CLIENT" || !proposalIdFromQuery || !proposalsQuery.data?.length) return;

    const proposal = proposalsQuery.data.find((item) => item.id === proposalIdFromQuery);
    if (!proposal?.job?.id) return;

    setClientViewTab("proposals");
    setProposalStatusFilter("ALL");
    setSelectedJobId(proposal.job.id);
  }, [proposalIdFromQuery, proposalsQuery.data, user?.role]);

  const notificationsQuery = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: async () => {
      const response = await notificationsApi.list(10);
      return {
        notifications: response.data?.notifications || [],
        unreadCount: response.data?.unreadCount || 0,
      };
    },
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => notificationsApi.markRead(notificationId),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
  });

  const updateProposalStatusMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: number; status: "SHORTLISTED" | "ACCEPTED" | "REJECTED" }) =>
      proposalsApi.updateStatus(proposalId, status),
    onSuccess: async (_, variables) => {
      setProposalStatusOverrides((current) => ({
        ...current,
        [variables.proposalId]: variables.status,
      }));
      setProposalActionStatus(`Proposal updated to ${variables.status}`);
      await proposalsQuery.refetch();
      await myJobsQuery.refetch();
      await savedFreelancersQuery.refetch();
      await notificationsQuery.refetch();
    },
    onError: (err: any) => {
      setProposalActionStatus(err?.response?.data?.detail || "Unable to update proposal status");
    },
  });

  const toggleSavedFreelancerMutation = useMutation({
    mutationFn: async (freelancerId: number) => savedFreelancersApi.toggle(freelancerId),
    onSuccess: async (response: any) => {
      setProposalActionStatus(response?.data?.saved ? "Freelancer saved" : "Freelancer removed from saved list");
      await savedFreelancersQuery.refetch();
    },
    onError: (err: any) => {
      setProposalActionStatus(err?.response?.data?.detail || "Unable to save freelancer");
    },
  });

  const adminOverviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const response = await adminApi.overview();
      return response.data as AdminOverview;
    },
    enabled: user?.role === "ADMIN",
  });

  const freelancerProfileQuery = useQuery({
    queryKey: ["dashboard-freelancer-profile"],
    queryFn: async () => {
      const response = await freelancerProfileApi.me();
      return (response.data?.profile as FreelancerProfileSummary | null) || null;
    },
    enabled: user?.role === "FREELANCER",
  });

  const clientProfileQuery = useQuery({
    queryKey: ["dashboard-client-profile"],
    queryFn: async () => {
      const response = await clientProfileApi.me();
      return (response.data?.profile as ClientProfileSummary | null) || null;
    },
    enabled: user?.role === "CLIENT",
  });

  const quickActions = [
    { label: "Browse jobs", icon: Search, href: "/jobs", show: user?.role === "FREELANCER" },
    { label: "Browse freelancers", icon: Eye, href: "/freelancers", show: user?.role === "CLIENT" },
    { label: "Get Jobs", icon: Briefcase, href: "/freelancer/jobs", show: user?.role === "FREELANCER" },
    { label: "Career Navigator", icon: Compass, href: "/career-navigator", show: user?.role === "FREELANCER" },
    { label: "Solve Tasks", icon: Code2, href: "/tasks", show: user?.role === "FREELANCER" },
    { label: "Post a Job", icon: Plus, href: "/client/post-job", show: user?.role === "CLIENT" },
    { label: "Open Wallet", icon: Wallet, href: "/wallet", show: true },
  ].filter((a) => a.show);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome ${user?.username ?? "back"}. Review your wallet, role, and quick actions from one focused place.`}
      sidebar={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-500">Workspace</p>
          <nav className="space-y-1">
            {[
              { label: "Overview", href: "/dashboard", icon: Search },
              ...(user?.role === "FREELANCER" ? [{ label: "Get Jobs", href: "/freelancer/jobs", icon: Briefcase }] : []),
              ...(user?.role === "FREELANCER" ? [{ label: "Career Navigator", href: "/career-navigator", icon: Compass }] : []),
              ...(user?.role === "CLIENT" ? [{ label: "Post a Job", href: "/client/post-job", icon: Plus }] : []),
              { label: "Freelancers", href: "/freelancers", icon: Eye },
              ...(user?.role === "FREELANCER" ? [{ label: "Job Board", href: "/jobs", icon: Search }] : []),
              { label: "Messages & Support", href: "/support", icon: MessageSquare },
              { label: "Wallet", href: "/wallet", icon: Wallet },
              ...(user?.role === "FREELANCER" ? [{ label: "Coding Tasks", href: "/tasks", icon: Code2 }] : []),
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      }
    >
      {/* Wallet + Quick Actions */}
      <section className="grid gap-5 md:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden card-surface p-6"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success-500 via-primary-500 to-accent-500" />
          <p className="mt-1 text-sm text-surface-500">Wallet balance</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-success-50 to-success-100 text-success-600">
              <Coins className="h-6 w-6" />
            </div>
            <span className="font-heading text-4xl font-bold text-surface-900">
              {dashboard?.walletBalance ?? 0}
            </span>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-surface p-6 md:col-span-2"
        >
          <p className="text-sm text-surface-500">Quick actions</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="btn-primary btn-sm inline-flex items-center gap-1.5"
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </motion.article>
      </section>

      {/* CLIENT Section */}
      {user?.role === "CLIENT" ? (
        <>
          {/* Notifications */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm">
            <div className="flex items-center justify-between gap-3 border-b border-surface-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-surface-500" />
                <h2 className="font-heading text-lg font-semibold text-surface-900">Notifications</h2>
              </div>
              <button onClick={() => markAllReadMutation.mutate()} className="btn-ghost btn-sm text-xs" disabled={markAllReadMutation.isPending}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read ({notificationsQuery.data?.unreadCount || 0})
              </button>
            </div>
            <div className="max-h-[300px] divide-y divide-surface-100 overflow-y-auto">
              {(notificationsQuery.data?.notifications || []).map((item: any) => (
                item.link ? (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={async (event) => {
                      event.preventDefault();
                      if (!item.isRead) {
                        await markNotificationReadMutation.mutateAsync(item.id);
                      }
                      router.push(item.link);
                    }}
                    className={`block px-6 py-4 transition-colors hover:bg-primary-50/30 ${!item.isRead ? "bg-primary-50/20" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />}
                      <div>
                        <p className="font-medium text-surface-900">{item.title}</p>
                        <p className="mt-1 text-sm text-surface-500">{item.body}</p>
                        <p className="mt-1 text-xs font-medium text-primary-600">Tap to review →</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <article key={item.id} className={`px-6 py-4 ${!item.isRead ? "bg-primary-50/20" : ""}`}>
                    <p className="font-medium text-surface-900">{item.title}</p>
                    <p className="mt-1 text-sm text-surface-500">{item.body}</p>
                  </article>
                )
              ))}
              {!notificationsQuery.data?.notifications?.length ? <p className="px-6 py-4 text-sm text-surface-500">No notifications yet.</p> : null}
            </div>
          </motion.section>

          {/* Client Profile */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 card-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-surface-900">Client profile</h2>
              <button onClick={() => router.push("/onboarding/client?edit=1")} className="btn-secondary btn-md">
                {clientProfileQuery.data ? "Edit profile" : "Create profile"}
              </button>
            </div>

            {clientProfileQuery.data ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { label: "Identity", value: clientProfileQuery.data.displayName, sub: clientProfileQuery.data.accountType === "COMPANY" ? clientProfileQuery.data.companyName || "Company" : "Individual client" },
                  { label: "Budget range", value: clientProfileQuery.data.budgetRange },
                  { label: "Country", value: clientProfileQuery.data.country },
                  { label: "Timezone", value: clientProfileQuery.data.timezone, sub: clientProfileQuery.data.phone || undefined },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-surface-200/60 bg-surface-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{item.label}</p>
                    <p className="mt-1 font-medium text-surface-900">{item.value}</p>
                    {item.sub ? <p className="mt-1 text-sm text-surface-500">{item.sub}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-surface-500">Complete your client profile to build trust with freelancers before posting projects.</p>
            )}
          </motion.section>

          <ClientAnalytics />

          {/* Client Workspace */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 card-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-surface-900">Client workspace</h2>
              <div className="flex gap-1.5 rounded-xl bg-surface-100 p-1">
                <button
                  type="button"
                  onClick={() => setClientViewTab("proposals")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    clientViewTab === "proposals" ? "bg-white text-surface-900 shadow-card-sm" : "text-surface-500 hover:text-surface-700"
                  }`}
                >
                  Proposals ({proposalsQuery.data?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setClientViewTab("saved")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    clientViewTab === "saved" ? "bg-white text-surface-900 shadow-card-sm" : "text-surface-500 hover:text-surface-700"
                  }`}
                >
                  Saved ({savedFreelancersQuery.data?.length || 0})
                </button>
              </div>
            </div>

            {clientViewTab === "proposals" ? (
              <div className="mt-4 space-y-4">
                {!myJobsQuery.data?.length ? (
                  <p className="text-sm text-surface-500">You have not posted any jobs yet.</p>
                ) : (
                  <>
                    <select className="input" value={selectedJobId} onChange={(event) => setSelectedJobId(Number(event.target.value))}>
                      {myJobsQuery.data.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({proposalCountsByJob[job.id] || 0})
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1.5">
                      {(["ALL", "SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setProposalStatusFilter(status)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            proposalStatusFilter === status
                              ? "bg-surface-900 text-white shadow-sm"
                              : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                          }`}
                        >
                          {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {visibleClientProposals.map((proposal) => {
                        const initials = (proposal.freelancer.username || proposal.freelancer.name || "U").slice(0, 2).toUpperCase();
                        const displayStatus = getDisplayedProposalStatus(proposal);
                        return (
                          <article key={proposal.id} className="rounded-xl border border-surface-200/80 bg-white p-4 transition-colors hover:bg-surface-50/50">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white shadow-sm">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-medium text-surface-900">{proposal.freelancer.username || proposal.freelancer.name}</p>
                                  <p className="text-xs text-surface-500">{proposal.freelancer.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ${proposalStatusConfig[displayStatus] || "bg-surface-100 text-surface-700"}`}>
                                  {displayStatus}
                                </span>
                                <p className="text-xs text-surface-400">{new Date(proposal.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-surface-600">{proposal.coverLetter}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn-secondary btn-sm"
                                onClick={() => router.push(`/freelancers/${proposal.freelancer.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5" /> Profile
                              </button>
                              <button type="button" className="btn-secondary btn-sm" disabled={updateProposalStatusMutation.isPending}
                                onClick={() => updateProposalStatusMutation.mutate({ proposalId: proposal.id, status: "SHORTLISTED" })}>
                                Shortlist
                              </button>
                              <button type="button" className="btn-primary btn-sm" disabled={updateProposalStatusMutation.isPending}
                                onClick={() => updateProposalStatusMutation.mutate({ proposalId: proposal.id, status: "ACCEPTED" })}>
                                Accept
                              </button>
                              <button type="button" className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50 hover:text-danger-700" disabled={updateProposalStatusMutation.isPending}
                                onClick={() => updateProposalStatusMutation.mutate({ proposalId: proposal.id, status: "REJECTED" })}>
                                Reject
                              </button>
                              <button type="button" className="btn-secondary btn-sm" disabled={toggleSavedFreelancerMutation.isPending}
                                onClick={() => toggleSavedFreelancerMutation.mutate(proposal.freelancer.id)}>
                                <BookmarkCheck className="h-3.5 w-3.5" /> Save
                              </button>
                            </div>
                          </article>
                        );
                      })}
                      {!visibleClientProposals.length ? <p className="text-sm text-surface-500">No applications yet for this job.</p> : null}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {(savedFreelancersQuery.data || []).map((item) => {
                  const initials = (item.freelancer.username || item.freelancer.name || "U").slice(0, 2).toUpperCase();
                  return (
                    <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200/60 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{item.freelancer.username || item.freelancer.name}</p>
                          <p className="text-xs text-surface-500">{item.freelancer.email}</p>
                        </div>
                      </div>
                      <button type="button" className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50" disabled={toggleSavedFreelancerMutation.isPending}
                        onClick={() => toggleSavedFreelancerMutation.mutate(item.freelancer.id)}>
                        <UserMinus className="h-3.5 w-3.5" /> Remove
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => router.push(`/freelancers/${item.freelancer.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Profile
                      </button>
                    </article>
                  );
                })}
                {!savedFreelancersQuery.data?.length ? <p className="text-sm text-surface-500">No saved freelancers yet.</p> : null}
              </div>
            )}

            {proposalActionStatus ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-2 text-sm text-primary-700">
                {proposalActionStatus}
              </motion.p>
            ) : null}
          </motion.section>
        </>
      ) : null}

      {/* FREELANCER Section */}
      {user?.role === "FREELANCER" ? (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 card-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-surface-900">Freelancer profile</h2>
            <button onClick={() => router.push("/onboarding/freelancer?edit=1")} className="btn-secondary btn-md">
              {freelancerProfileQuery.data ? "Edit profile" : "Create profile"}
            </button>
          </div>

          {freelancerProfileQuery.data ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { label: "Title", value: freelancerProfileQuery.data.professionalTitle, sub: freelancerProfileQuery.data.experienceLevel },
                { label: "Skills", value: freelancerProfileQuery.data.skills },
                { label: "Rate", value: `$${freelancerProfileQuery.data.hourlyRateUsd}/hr` },
                { label: "Location", value: `${freelancerProfileQuery.data.city}, ${freelancerProfileQuery.data.country}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-surface-200/60 bg-surface-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{item.label}</p>
                  <p className="mt-1 font-medium text-surface-900">{item.value}</p>
                  {item.sub ? <p className="mt-1 text-sm text-surface-500">{item.sub}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-surface-500">Complete your freelancer profile to receive better job matches and client trust.</p>
          )}

          <FreelancerAnalytics />

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-6 card-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-surface-900">Jobs applied</h2>
              <button onClick={() => router.push("/freelancer/jobs")} className="btn-secondary btn-sm">
                Explore more jobs
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(freelancerAppliedJobsQuery.data || []).map((proposal) => (
                <article key={proposal.id} className="rounded-xl border border-surface-200/80 bg-white p-4 transition-colors hover:bg-surface-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-surface-900">{proposal.job?.title || "Job"}</p>
                      <p className="text-xs text-surface-500">
                        Client: {proposal.job?.client?.username || proposal.job?.client?.name || "Unknown"}
                      </p>
                    </div>
                    <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ${proposalStatusConfig[proposal.status] || "bg-surface-100 text-surface-700"}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-surface-500">
                    <p>Applied: {new Date(proposal.createdAt).toLocaleString()}</p>
                    <p>Budget: ₹{proposal.job?.budget || 0}</p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => proposal.job?.id && router.push(`/jobs/${proposal.job.id}`)}
                    >
                      View job
                    </button>
                  </div>
                </article>
              ))}
              {!freelancerAppliedJobsQuery.data?.length ? (
                <p className="text-sm text-surface-500">No applications yet. Apply to jobs and track them here.</p>
              ) : null}
            </div>
          </motion.section>
        </motion.section>
      ) : null}

      {/* ADMIN Section */}
      {user?.role === "ADMIN" ? (
        <section className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: "Total users", value: adminOverviewQuery.data?.counts.users ?? 0 },
              { label: "Total jobs", value: adminOverviewQuery.data?.counts.jobs ?? 0 },
              { label: "Total proposals", value: adminOverviewQuery.data?.counts.proposals ?? 0 },
            ].map((item) => (
              <motion.article key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-6">
                <p className="text-sm text-surface-500">{item.label}</p>
                <p className="mt-2 font-heading text-3xl font-bold text-surface-900">{item.value}</p>
              </motion.article>
            ))}
          </div>

          <article className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm">
            <div className="border-b border-surface-100 px-6 py-4">
              <h2 className="font-heading text-xl font-semibold text-surface-900">Recent users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-500">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {(adminOverviewQuery.data?.users || []).map((item) => (
                    <tr key={item.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50">
                      <td className="px-6 py-3 text-surface-800">{item.username || item.name}</td>
                      <td className="px-6 py-3 text-surface-500">{item.email}</td>
                      <td className="px-6 py-3">
                        <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{item.role}</span>
                      </td>
                      <td className="px-6 py-3 text-surface-600">{item.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card-surface p-6">
            <h2 className="font-heading text-xl font-semibold text-surface-900">Recent jobs</h2>
            <div className="mt-4 space-y-3">
              {(adminOverviewQuery.data?.jobs || []).map((job) => (
                <div key={job.id} className="rounded-xl border border-surface-200/60 bg-surface-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-surface-900">{job.title}</p>
                    <p className="text-xs text-surface-500">{new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-surface-500">Client: {job.client.username || job.client.name}</p>
                  <p className="mt-1 text-xs text-surface-400">Budget: {job.budget} | Proposals: {job._count.proposals}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card-surface p-6">
            <h2 className="font-heading text-xl font-semibold text-surface-900">Recent proposals</h2>
            <div className="mt-4 space-y-3">
              {(adminOverviewQuery.data?.proposals || []).map((proposal) => (
                <div key={proposal.id} className="rounded-xl border border-surface-200/60 bg-surface-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-surface-900">{proposal.job.title}</p>
                    <p className="text-xs text-surface-500">{new Date(proposal.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-surface-500">Freelancer: {proposal.freelancer.username || proposal.freelancer.name}</p>
                  <p className="mt-2 text-sm text-surface-600">{proposal.coverLetter}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </DashboardLayout>
  );
}
