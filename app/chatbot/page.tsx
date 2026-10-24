"use client";

import { ChatbotWidget } from "@/components/ChatbotWidget";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAIJobMatch } from "@/hooks/useAIJobMatch";
import { useAuth } from "@/hooks/useAuth";
import { mockJobs } from "@/lib/db";

export default function ChatbotPage() {
  const { user } = useAuth();
  const recommendations = useAIJobMatch(user, mockJobs);

  return (
    <DashboardLayout
      title="AI Search Assistant"
      subtitle="Ask platform-specific questions and get smart answers about jobs, tokens, wallet actions, dashboard flow, and support."
    >
      <ChatbotWidget suggestions={recommendations} />
    </DashboardLayout>
  );
}
