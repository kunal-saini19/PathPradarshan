import { mockJobs, type MockJob, type MockUser } from "@/lib/db";

export type JobRecommendation = MockJob & {
  reasons: string[];
  score: number;
};

export function getJobRecommendations(profile: MockUser, jobs = mockJobs): JobRecommendation[] {
  const normalizedSkills = profile.skills.map((skill) => skill.toLowerCase());

  return jobs
    .map((job) => {
      const jobText = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
      const matchedSkills = normalizedSkills.filter((skill) => jobText.includes(skill));
      const score = Math.min(99, job.matchScore + matchedSkills.length * 2 + (profile.tokens > job.tokenCost ? 3 : 0));

      return {
        ...job,
        score,
        reasons: [
          `${matchedSkills.length || 1} skill signal(s) matched`,
          profile.tokens > job.tokenCost ? "Token balance supports premium access" : "Token balance can be improved",
          job.status === "Featured" ? "Featured opportunity" : "Strong fit for your profile",
        ],
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function generateChatReply(message: string) {
  const text = message.toLowerCase();

  if (text.includes("token") || text.includes("wallet")) {
    return "Tokens can be earned through learning, bought for fast access, or spent on premium applications and boosts.";
  }

  if (text.includes("job") || text.includes("match")) {
    return "I can surface jobs that fit your skills and token balance. Open the dashboard to view ranked recommendations.";
  }

  if (text.includes("support") || text.includes("help")) {
    return "If you need help, I can point you to the support page or summarize the most common account and wallet questions.";
  }

  return "I can help with jobs, tokens, wallet actions, or platform guidance. Ask me about any of those areas.";
}
