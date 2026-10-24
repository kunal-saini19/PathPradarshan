import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { mockFaqs, mockJobs } from "@/lib/db";

function createGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function scoreText(queryTokens: string[], text: string) {
  const haystack = text.toLowerCase();
  return queryTokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

function getRelevantContext(query: string) {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return {
      jobs: mockJobs.slice(0, 3),
      faqs: mockFaqs.slice(0, 3),
    };
  }

  const rankedJobs = mockJobs
    .map((job) => {
      const searchableText = [job.title, job.description, job.client, job.tags.join(" "), job.status].join(" ");
      return { job, score: scoreText(queryTokens, searchableText) };
    })
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 4)
    .map((entry) => entry.job);

  const rankedFaqs = mockFaqs
    .map((faq) => {
      const searchableText = `${faq.question} ${faq.answer}`;
      return { faq, score: scoreText(queryTokens, searchableText) };
    })
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 4)
    .map((entry) => entry.faq);

  return {
    jobs: rankedJobs.length > 0 ? rankedJobs : mockJobs.slice(0, 3),
    faqs: rankedFaqs.length > 0 ? rankedFaqs : mockFaqs.slice(0, 3),
  };
}

const platformContext = [
  "2Gathers platform facts:",
  "- Roles: CLIENT, FREELANCER, ADMIN",
  "- Main routes: /start, /jobs, /leaderboard, /wallet, /dashboard, /support",
  "- Wallet supports linking address, buying tokens, and token transaction history",
  "- Jobs are posted by clients and browsed/saved by freelancers",
  "- Leaderboard highlights top freelancers",
  "- AI assistant should answer platform and freelancing workflow questions first",
  "- If asked outside platform scope, provide a short helpful answer and guide back to platform usage",
  "",
  "Current FAQ snippets:",
  ...mockFaqs.map((f) => `Q: ${f.question} A: ${f.answer}`),
  "",
  "Current featured jobs:",
  ...mockJobs.slice(0, 4).map((j) => `- ${j.title} (${j.client}) budget ${j.budget}, tokens ${j.tokenCost}, status ${j.status}`),
].join("\n");

function normalizeMessages(messages: any[]): ChatMessage[] {
  return messages
    .map((msg) => {
      const role: ChatMessage["role"] = msg?.role === "assistant" ? "assistant" : "user";
      const content = typeof msg?.content === "string"
        ? msg.content
        : typeof msg?.text === "string"
          ? msg.text
          : "";

      return {
        role,
        content: content.trim(),
      };
    })
    .filter((msg) => msg.content.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ API key is not configured" },
        { status: 500 }
      );
    }

    const client = createGroqClient();

    const chatMessages = normalizeMessages(messages);

    if (chatMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages were provided" },
        { status: 400 }
      );
    }

    const latestUserMessage = [...chatMessages]
      .reverse()
      .find((msg) => msg.role === "user")?.content ?? "";

    const relevantContext = getRelevantContext(latestUserMessage);
    const dynamicContext = [
      "Relevant jobs for this query:",
      ...relevantContext.jobs.map(
        (job) =>
          `- ${job.title} | client: ${job.client} | budget: ${job.budget} | tags: ${job.tags.join(", ")} | status: ${job.status} | token cost: ${job.tokenCost}`
      ),
      "",
      "Relevant FAQ snippets for this query:",
      ...relevantContext.faqs.map((faq) => `- Q: ${faq.question} A: ${faq.answer}`),
    ].join("\n");

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 700,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are 2Gathers AI Search Assistant. Be accurate, practical, and concise. Prioritize platform-specific guidance and step-by-step help for freelancers and clients. If uncertain, say what is unknown and suggest the next best action.\n\n" +
            platformContext +
            "\n\n" +
            dynamicContext,
        },
        ...chatMessages,
      ],
    });

    const assistantMessage = response.choices?.[0]?.message?.content?.trim() || "I can help with jobs, wallet, tokens, support, and platform workflow. Ask me a specific question.";

    return NextResponse.json({
      message: assistantMessage,
      id: Date.now().toString(),
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
