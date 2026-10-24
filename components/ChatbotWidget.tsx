"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { MockJob } from "@/lib/db";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export function ChatbotWidget({ suggestions }: { suggestions: MockJob[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi, I'm 2Gathers AI Search Assistant powered by Groq. Ask me anything about jobs, wallet, tokens, dashboard flow, or support.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickReplies = useMemo(
    () => [
      "Find jobs matching my skills",
      "How do tokens and wallet actions work?",
      "I am a client: how do I post and manage a job?",
    ],
    [],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.message,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      {/* Chat area */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-surface-100 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">AI Assistant</p>
            <p className="text-xs text-surface-500">Powered by Groq</p>
          </div>
          {isLoading && (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: "420px" }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-600/20"
                    : "bg-surface-50 text-surface-700 ring-1 ring-surface-200/80"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-surface-50 px-4 py-3 ring-1 ring-surface-200/80">
                <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-surface-100 p-3">
          <div className="flex gap-2 rounded-xl bg-surface-50 p-1.5 ring-1 ring-surface-200/80 focus-within:ring-2 focus-within:ring-primary-500/30 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={isLoading}
              placeholder="Ask the assistant something..."
              className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-surface-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm transition-all hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5">
        <div className="rounded-2xl border border-surface-200/80 bg-white p-5 shadow-card-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
            Quick replies
          </p>
          <div className="mt-3 space-y-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => sendMessage(reply)}
                disabled={isLoading}
                className="w-full rounded-xl border border-surface-200/80 bg-white px-4 py-3 text-left text-sm text-surface-700 shadow-card-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-white p-5 shadow-card-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
            Recommended jobs
          </p>
          <div className="mt-3 space-y-2.5">
            {suggestions.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-surface-200/80 bg-surface-50/50 p-3 transition-colors hover:bg-primary-50/30"
              >
                <p className="text-sm font-medium text-surface-900">{job.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-surface-500">
                  <span>{job.client}</span>
                  <span className="text-surface-300">·</span>
                  <span className="font-semibold text-primary-600">{job.matchScore}% fit</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
