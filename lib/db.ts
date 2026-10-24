export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tokens: number;
  headline: string;
  skills: string[];
  bio: string;
};

export type MockJob = {
  id: string;
  title: string;
  client: string;
  description: string;
  budget: string;
  tokenCost: number;
  matchScore: number;
  tags: string[];
  status: "Open" | "Featured" | "Matched";
};

export type MockTokenTransaction = {
  id: string;
  type: "earn" | "buy" | "spend" | "transfer";
  label: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
};

export type MockFaq = {
  question: string;
  answer: string;
};

export type MockTeamMember = {
  name: string;
  role: string;
  bio: string;
};

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "Kunal Saini",
    email: "kunal112@gmail.com",
    role: "FREELANCER",
    tokens: 240,
    headline: "Product designer and full-stack freelancer",
    skills: ["Next.js", "TypeScript", "Tailwind", "AI UX"],
    bio: "Builds polished marketplace and SaaS experiences with a bias toward clarity and speed.",
  },
  {
    id: "u2",
    name: "Aarav Mehta",
    email: "aarav@2gathers.dev",
    role: "CLIENT",
    tokens: 800,
    headline: "Hiring manager at Studio North",
    skills: ["Hiring", "Leadership", "Product Strategy"],
    bio: "Uses 2Gathers to post premium projects and short-list strong freelancers quickly.",
  },
  {
    id: "u3",
    name: "Script Four",
    email: "script4@2gathers.dev",
    role: "ADMIN",
    tokens: 1200,
    headline: "Platform operations",
    skills: ["Moderation", "Analytics", "Policy"],
    bio: "Oversees token policies, wallet adjustments, and marketplace quality controls.",
  },
];

export const mockJobs: MockJob[] = [
  {
    id: "j1",
    title: "Build a clean AI matching dashboard",
    client: "Studio North",
    description: "Design and implement a highly polished freelancer dashboard with recommendation cards and token metrics.",
    budget: "$2,400",
    tokenCost: 45,
    matchScore: 97,
    tags: ["Next.js", "Dashboard", "AI"],
    status: "Featured",
  },
  {
    id: "j2",
    title: "Token wallet prototype for a marketplace",
    client: "Inkwell Labs",
    description: "Prototype a token economy with earn, spend, and transfer flows while keeping the UI clean and minimal.",
    budget: "$1,850",
    tokenCost: 35,
    matchScore: 93,
    tags: ["Fintech", "Wallet", "Blockchain"],
    status: "Open",
  },
  {
    id: "j3",
    title: "Chatbot assistant for candidate support",
    client: "Northstar HR",
    description: "Create a conversational interface that helps freelancers find relevant jobs and understand token usage.",
    budget: "$1,200",
    tokenCost: 25,
    matchScore: 88,
    tags: ["Chatbot", "AI UX", "Support"],
    status: "Matched",
  },
  {
    id: "j4",
    title: "Responsive landing page for a hiring platform",
    client: "Orbit Works",
    description: "Build a modern, serious landing page with subtle gradients and responsive sections.",
    budget: "$950",
    tokenCost: 15,
    matchScore: 84,
    tags: ["UI", "Brand", "Responsive"],
    status: "Open",
  },
];

export const mockTokenTransactions: MockTokenTransaction[] = [
  {
    id: "t1",
    type: "earn",
    label: "Completed learning module",
    amount: 30,
    balanceAfter: 240,
    createdAt: "2026-04-10T09:30:00Z",
  },
  {
    id: "t2",
    type: "spend",
    label: "Applied to premium job",
    amount: -45,
    balanceAfter: 210,
    createdAt: "2026-04-10T10:15:00Z",
  },
  {
    id: "t3",
    type: "buy",
    label: "Bought tokens via wallet",
    amount: 120,
    balanceAfter: 330,
    createdAt: "2026-04-10T11:05:00Z",
  },
  {
    id: "t4",
    type: "transfer",
    label: "Transferred to freelancer",
    amount: -40,
    balanceAfter: 290,
    createdAt: "2026-04-10T11:48:00Z",
  },
];

export const mockTeam: MockTeamMember[] = [
  {
    name: "Product Team",
    role: "Vision",
    bio: "Shipping a focused freelancing platform with quality tooling and simple workflows.",
  },
  {
    name: "Engineering Team",
    role: "Platform",
    bio: "Maintaining the AI matching engine, token ledger, and future blockchain integration path.",
  },
  {
    name: "Support Team",
    role: "Success",
    bio: "Helping clients and freelancers get value from the platform quickly and safely.",
  },
];

export const mockFaqs: MockFaq[] = [
  {
    question: "How do tokens work?",
    answer: "Tokens are the platform currency used for premium applications, boosts, and wallet rewards. Freelancers earn tokens by completing jobs and clients buy tokens to post premium jobs.",
  },
  {
    question: "Can I use this without crypto?",
    answer: "Yes. The prototype simulates blockchain behavior now and can evolve into real web3 later. You can link a wallet address on the Wallet page to practice transfers.",
  },
  {
    question: "How does AI job matching work?",
    answer: "Job recommendations are scored from your skills, role fit, availability, and token activity. The AI Search Assistant helps you find jobs relevant to your profile.",
  },
  {
    question: "Is the database real?",
    answer: "Yes. Prisma persists your account data, job history, and wallet activity in the configured PostgreSQL database.",
  },
];

export function getMockUser(id: string) {
  return mockUsers.find((user) => user.id === id) ?? mockUsers[0];
}

export function getMockWallet(userId: string) {
  const user = getMockUser(userId);
  return {
    userId: user.id,
    address: `twogathers:${user.id}:wallet`,
    balance: user.tokens,
    tokenName: "2GTH",
    network: "Simulated Ledger",
  };
}

// Task System
export type SupportedLanguage = "javascript" | "typescript" | "python" | "java";

export type MockTask = {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  timeLimit?: number;
  functionName: string;
  language: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  starterCodeByLanguage: Record<SupportedLanguage, string>;
};

export type MockTestCase = {
  args: unknown[];
  expected: unknown;
  description: string;
  hidden?: boolean;
};

export const mockTasks: MockTask[] = [
  {
    id: "t1",
    title: "Sum of Two Numbers",
    description: "Write a function that takes two numbers and returns their sum.",
    difficulty: "BEGINNER",
    category: "Basic Math",
    rewardTokens: 10,
    timeLimit: 15,
    functionName: "sum",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    starterCodeByLanguage: {
      javascript: `function sum(a, b) {
  // Write your code here
  return a + b;
}`,
      typescript: `function sum(a: number, b: number): number {
  // Write your code here
  return a + b;
}`,
      python: `def sum(a, b):
    # Write your code here
    return a + b`,
      java: `class Solution {
    public int sum(int a, int b) {
        // Write your code here
        return a + b;
    }
}`,
    },
  },
  {
    id: "t2",
    title: "Even or Odd",
    description: "Write a function that checks if a number is even or odd.",
    difficulty: "BEGINNER",
    category: "Logic",
    rewardTokens: 10,
    timeLimit: 15,
    functionName: "isEven",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    starterCodeByLanguage: {
      javascript: `function isEven(num) {
  // Write your code here
  return num % 2 === 0;
}`,
      typescript: `function isEven(num: number): boolean {
  // Write your code here
  return num % 2 === 0;
}`,
      python: `def isEven(num):
    # Write your code here
    return num % 2 == 0`,
      java: `class Solution {
    public boolean isEven(int num) {
        // Write your code here
        return num % 2 == 0;
    }
}`,
    },
  },
  {
    id: "t3",
    title: "Reverse a String",
    description: "Write a function that reverses a given string.",
    difficulty: "BEGINNER",
    category: "String Manipulation",
    rewardTokens: 15,
    timeLimit: 20,
    functionName: "reverseString",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    starterCodeByLanguage: {
      javascript: `function reverseString(str) {
  // Write your code here
  return str.split("").reverse().join("");
}`,
      typescript: `function reverseString(str: string): string {
  // Write your code here
  return str.split("").reverse().join("");
}`,
      python: `def reverseString(str):
    # Write your code here
    return str[::-1]`,
      java: `class Solution {
    public String reverseString(String str) {
        // Write your code here
        return new StringBuilder(str).reverse().toString();
    }
}`,
    },
  },
  {
    id: "t4",
    title: "Find Maximum in Array",
    description: "Write a function that finds the maximum value in an array.",
    difficulty: "INTERMEDIATE",
    category: "Array Operations",
    rewardTokens: 25,
    timeLimit: 25,
    functionName: "findMax",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    starterCodeByLanguage: {
      javascript: `function findMax(arr) {
  // Write your code here
  return Math.max(...arr);
}`,
      typescript: `function findMax(arr: number[]): number {
  // Write your code here
  return Math.max(...arr);
}`,
      python: `def findMax(arr):
    # Write your code here
    return max(arr)`,
      java: `class Solution {
    public int findMax(int[] arr) {
        // Write your code here
        int max = arr[0];
        for (int value : arr) {
            if (value > max) max = value;
        }
        return max;
    }
}`,
    },
  },
];

export const mockTestCases: Record<string, MockTestCase[]> = {
  t1: [
    { args: [5, 3], expected: 8, description: "Sum of 5 and 3" },
    { args: [10, 20], expected: 30, description: "Sum of 10 and 20" },
    { args: [-5, 5], expected: 0, description: "Sum of -5 and 5", hidden: true },
  ],
  t2: [
    { args: [4], expected: true, description: "4 is even" },
    { args: [7], expected: false, description: "7 is odd" },
    { args: [0], expected: true, description: "0 is even", hidden: true },
  ],
  t3: [
    { args: ["hello"], expected: "olleh", description: "Reverse hello" },
    { args: ["world"], expected: "dlrow", description: "Reverse world" },
    { args: ["a"], expected: "a", description: "Reverse single char", hidden: true },
  ],
  t4: [
    { args: [[3, 7, 2, 9, 1]], expected: 9, description: "Max of array" },
    { args: [[10, 20, 15]], expected: 20, description: "Max of 10,20,15" },
    { args: [[-5, -2, -10]], expected: -2, description: "Max of negatives", hidden: true },
  ],
};

export function getStarterCode(task: MockTask, language: SupportedLanguage) {
  return task.starterCodeByLanguage[language] ?? task.starterCodeByLanguage[task.language];
}
