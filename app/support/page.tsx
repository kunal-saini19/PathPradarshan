"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, BellOff, MessageSquare, Send, CheckCheck } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { messagesApi, notificationsApi, proposalsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type InboxProposal = {
  id: number;
  status: string;
  job: {
    id: number;
    title: string;
    clientId: number;
    client: {
      id: number;
      username: string | null;
      name: string;
    };
  };
  freelancer: {
    id: number;
    username: string | null;
    name: string;
  };
};

type ThreadMessage = {
  id: number;
  body: string;
  createdAt: string;
  senderId: number;
  sender: {
    id: number;
    username: string | null;
    name: string;
    role: string;
  };
};

export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedProposalId, setSelectedProposalId] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  const notificationsQuery = useQuery({
    queryKey: ["support-notifications"],
    queryFn: async () => {
      const response = await notificationsApi.list(40);
      return {
        notifications: response.data?.notifications || [],
        unreadCount: response.data?.unreadCount || 0,
      };
    },
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  const proposalsQuery = useQuery({
    queryKey: ["support-proposal-inbox"],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals || []) as InboxProposal[];
    },
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!selectedProposalId && proposalsQuery.data?.length) {
      setSelectedProposalId(proposalsQuery.data[0].id);
    }
  }, [proposalsQuery.data, selectedProposalId]);

  const selectedProposal = useMemo(
    () => proposalsQuery.data?.find((item) => item.id === selectedProposalId) || null,
    [proposalsQuery.data, selectedProposalId],
  );

  const threadQuery = useQuery({
    queryKey: ["support-thread", selectedProposalId],
    queryFn: async () => {
      const response = await messagesApi.listByProposal(selectedProposalId);
      return (response.data?.messages || []) as ThreadMessage[];
    },
    enabled: selectedProposalId > 0,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadQuery.data]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return messagesApi.create({
        proposalId: selectedProposalId,
        body: messageInput,
      });
    },
    onSuccess: async () => {
      setMessageInput("");
      setMessageStatus("Message sent");
      await threadQuery.refetch();
      await notificationsQuery.refetch();
    },
    onError: (err: any) => {
      setMessageStatus(err?.response?.data?.detail || "Unable to send message");
    },
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

  function sendMessage() {
    if (!selectedProposalId) {
      setMessageStatus("Select a proposal thread first");
      return;
    }

    if (!messageInput.trim()) {
      setMessageStatus("Type a message before sending");
      return;
    }

    sendMessageMutation.mutate();
  }

  return (
    <DashboardLayout title="Support & Inbox" subtitle="Real-time style messaging with polling and an in-app notifications center.">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-surface-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-surface-500" />
              <p className="font-heading text-sm font-semibold text-surface-900">Notifications</p>
              {(notificationsQuery.data?.unreadCount || 0) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                  {notificationsQuery.data?.unreadCount}
                </span>
              )}
            </div>
            <button
              className="btn-ghost btn-sm text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
          <div className="max-h-[480px] divide-y divide-surface-100 overflow-y-auto">
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
                  className={`block px-5 py-4 transition-colors hover:bg-primary-50/40 ${!item.isRead ? "bg-primary-50/20" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!item.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />}
                    <div className={!item.isRead ? "" : "pl-4"}>
                      <p className="text-sm font-semibold text-surface-900">{item.title}</p>
                      <p className="mt-1 text-sm text-surface-500">{item.body}</p>
                      <p className="mt-1.5 text-xs font-medium text-primary-600">Tap to review →</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <article key={item.id} className={`px-5 py-4 ${!item.isRead ? "bg-primary-50/20" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!item.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />}
                    <div className={!item.isRead ? "" : "pl-4"}>
                      <p className="text-sm font-semibold text-surface-900">{item.title}</p>
                      <p className="mt-1 text-sm text-surface-500">{item.body}</p>
                      <p className="mt-1 text-xs text-surface-400">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </article>
              )
            ))}
            {!notificationsQuery.data?.notifications?.length ? (
              <div className="px-5 py-8 text-center text-sm text-surface-500">No notifications yet.</div>
            ) : null}
          </div>
        </motion.section>

        {/* Messages */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm"
        >
          <div className="flex items-center gap-2 border-b border-surface-100 px-5 py-4">
            <MessageSquare className="h-4 w-4 text-surface-500" />
            <p className="font-heading text-sm font-semibold text-surface-900">Messages</p>
          </div>

          {!proposalsQuery.data?.length ? (
            <div className="flex-1 px-5 py-8 text-center text-sm text-surface-500">
              No project threads available yet. Messaging unlocks when a proposal exists.
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="space-y-3 border-b border-surface-100 p-4">
                <select
                  value={selectedProposalId}
                  onChange={(event) => setSelectedProposalId(Number(event.target.value))}
                  className="input text-sm"
                >
                  {(proposalsQuery.data || []).map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.job.title} | {proposal.status}
                    </option>
                  ))}
                </select>

                {selectedProposal && (
                  <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-3 text-sm">
                    <div>
                      <span className="font-semibold text-surface-900">Project:</span>{" "}
                      <span className="text-surface-600">{selectedProposal.job.title}</span>
                    </div>
                    <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                      selectedProposal.status === "ACCEPTED" ? "bg-success-50 text-success-700" :
                      selectedProposal.status === "SHORTLISTED" ? "bg-warning-50 text-warning-700" :
                      "bg-surface-100 text-surface-600"
                    }`}>
                      {selectedProposal.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Message thread */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto p-4"
                style={{ maxHeight: "300px" }}
              >
                {(threadQuery.data || []).map((message) => {
                  const mine = Number(user?.id || 0) === message.senderId;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm"
                            : "bg-surface-100 text-surface-800 ring-1 ring-surface-200/80"
                        }`}
                      >
                        <p className={`text-xs font-medium ${mine ? "text-white/80" : "text-surface-500"}`}>
                          {message.sender.username || message.sender.name}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                        <p className={`mt-1 text-[11px] ${mine ? "text-white/60" : "text-surface-400"}`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!threadQuery.data?.length ? (
                  <p className="py-4 text-center text-sm text-surface-500">No messages yet in this thread.</p>
                ) : null}
              </div>

              {/* Message input */}
              <div className="border-t border-surface-100 p-3">
                <div className="flex gap-2">
                  <input
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="input flex-1"
                    placeholder="Type your message"
                  />
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-50"
                    onClick={sendMessage}
                    disabled={sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {messageStatus ? (
                  <p className="mt-2 text-xs text-surface-500">{messageStatus}</p>
                ) : null}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
