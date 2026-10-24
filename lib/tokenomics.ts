export const TOKEN_PRICE_INR = 8;
export const WEB3_NETWORK_NAME = "2Gathers Testnet";

type TokenCostParams = {
  budgetInr: number;
  title: string;
  description: string;
  proposalCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function budgetFactor(budgetInr: number) {
  if (budgetInr < 1_000) return 0;
  if (budgetInr < 5_000) return 1;
  if (budgetInr < 20_000) return 2;
  if (budgetInr < 50_000) return 3;
  if (budgetInr < 100_000) return 4;
  if (budgetInr < 250_000) return 5;
  return 6;
}

function complexityFactor(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const descLengthScore = Math.floor(description.length / 320);
  const hardKeywords = [
    "architecture",
    "scalable",
    "microservice",
    "blockchain",
    "ai",
    "ml",
    "security",
    "optimization",
    "real-time",
    "payment",
  ];
  const keywordScore = hardKeywords.reduce((sum, keyword) => (text.includes(keyword) ? sum + 1 : sum), 0) >= 2 ? 1 : 0;
  return clamp(descLengthScore + keywordScore, 0, 4);
}

function urgencyFactor(description: string) {
  const text = description.toLowerCase();
  if (/(urgent|asap|immediate|today|within\s*24\s*hours)/i.test(text)) return 3;
  if (/(quick|soon|priority|this week)/i.test(text)) return 2;
  if (/(deadline|timeline|delivery date)/i.test(text)) return 1;
  return 0;
}

function demandFactor(proposalCount: number) {
  if (proposalCount >= 40) return 5;
  if (proposalCount >= 25) return 4;
  if (proposalCount >= 15) return 3;
  if (proposalCount >= 8) return 2;
  if (proposalCount >= 3) return 1;
  return 0;
}

export function calculateApplicationTokenCost(params: TokenCostParams) {
  const base = 2;
  const b = budgetFactor(params.budgetInr);
  const c = complexityFactor(params.title, params.description);
  const u = urgencyFactor(params.description);
  const d = demandFactor(params.proposalCount);

  const tokenCost = clamp(base + b + c + u + d, 2, 20);
  return {
    tokenCost,
    priceInr: tokenCost * TOKEN_PRICE_INR,
    breakdown: { base, b, c, u, d },
  };
}
