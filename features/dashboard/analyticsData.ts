export const freelancerMetrics = [
  { label: "Total Earnings", value: "₹4,82,000", delta: "+20% MoM", helper: "After platform fees and disputes", positive: true },
  { label: "Monthly Earnings Growth", value: "20.4%", delta: "+4.3% vs last month", helper: "Rolling 90-day trend", positive: true },
  { label: "Active Projects", value: "6", helper: "2 at risk due to delayed client feedback" },
  { label: "Completed Projects", value: "39", helper: "Last 12 months" },
  { label: "Proposal Success Rate", value: "31.7%", helper: "Won proposals / submitted" },
  { label: "Profile Views", value: "1,284", delta: "+18%", helper: "Last 30 days", positive: true },
  { label: "Job Acceptance Rate", value: "86%", helper: "Offers accepted / offers received" },
  { label: "Average Rating", value: "4.8/5", helper: "Across 124 client reviews" },
  { label: "Task Completion Rate", value: "96.2%", helper: "On-time delivery weighted" },
  { label: "Response Time", value: "2.1 hrs", helper: "Average first response" },
] as const;

export const freelancerEarningsTrend = [
  { month: "Jan", earnings: 42000 },
  { month: "Feb", earnings: 46000 },
  { month: "Mar", earnings: 51000 },
  { month: "Apr", earnings: 57000 },
  { month: "May", earnings: 61000 },
  { month: "Jun", earnings: 68000 },
  { month: "Jul", earnings: 72000 },
];

export const freelancerProjectsByMonth = [
  { month: "Jan", completed: 2 },
  { month: "Feb", completed: 3 },
  { month: "Mar", completed: 3 },
  { month: "Apr", completed: 4 },
  { month: "May", completed: 5 },
  { month: "Jun", completed: 4 },
  { month: "Jul", completed: 6 },
];

export const freelancerSkillsDistribution = [
  { name: "React.js", value: 34 },
  { name: "Node.js", value: 22 },
  { name: "TypeScript", value: 18 },
  { name: "UI/UX", value: 14 },
  { name: "DevOps", value: 12 },
];

export const clientMetrics = [
  { label: "Total Jobs Posted", value: "58", helper: "Last 12 months" },
  { label: "Active Jobs", value: "9", helper: "Open or in-progress" },
  { label: "Completed Jobs", value: "44", helper: "Delivered and approved" },
  { label: "Total Spending", value: "₹12,48,000", delta: "+14% YoY", helper: "All completed payouts", positive: true },
  { label: "Avg Cost / Project", value: "₹28,364", helper: "Median smoothed" },
  { label: "Time to Hire", value: "3.6 days", helper: "From posting to acceptance" },
  { label: "Proposals / Job", value: "7.8", helper: "Avg across active verticals" },
  { label: "Freelancer Performance", value: "89/100", helper: "Quality + reliability score" },
  { label: "Rehire Rate", value: "42%", helper: "Used same freelancer again" },
  { label: "Project Success Rate", value: "91.3%", helper: "Scope/time/budget adherence" },
] as const;

export const clientSpendingTrend = [
  { month: "Jan", spending: 128000 },
  { month: "Feb", spending: 101000 },
  { month: "Mar", spending: 134000 },
  { month: "Apr", spending: 151000 },
  { month: "May", spending: 143000 },
  { month: "Jun", spending: 176000 },
  { month: "Jul", spending: 184000 },
];

export const clientJobsComparison = [
  { month: "Jan", posted: 8, completed: 6 },
  { month: "Feb", posted: 7, completed: 6 },
  { month: "Mar", posted: 9, completed: 7 },
  { month: "Apr", posted: 10, completed: 8 },
  { month: "May", posted: 8, completed: 7 },
  { month: "Jun", posted: 9, completed: 8 },
  { month: "Jul", posted: 7, completed: 6 },
];

export const clientFreelancerCategory = [
  { name: "Frontend", value: 28 },
  { name: "Full Stack", value: 26 },
  { name: "Design", value: 18 },
  { name: "AI/Data", value: 16 },
  { name: "Blockchain", value: 12 },
];
