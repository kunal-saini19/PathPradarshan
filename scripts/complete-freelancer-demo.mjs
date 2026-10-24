import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const user = await prisma.user.findFirst({
  where: {
    OR: [
      { username: "freelancer_demo" },
      { email: "freelancer.demo@2gathers.dev" },
    ],
  },
  select: { id: true, username: true, email: true },
});

if (!user) {
  throw new Error("freelancer_demo was not found. Run scripts/create-demo-login.mjs first.");
}

const profile = await prisma.freelancerProfile.upsert({
  where: { userId: user.id },
  update: {
    professionalTitle: "Frontend Developer",
    bio: "Frontend developer focused on accessible, responsive interfaces and practical product experiences.",
    skills: "HTML, CSS, JavaScript, React, TypeScript, REST APIs, Git, Testing",
    experienceLevel: "INTERMEDIATE",
    hourlyRateUsd: 35,
    country: "India",
    city: "Bengaluru",
    languages: "English, Hindi",
    availability: "PART_TIME",
    preferredWorkingHours: "Evenings and weekends",
    responseTime: "Within 24 hours",
    portfolioUrl: "https://github.com/freelancer-demo",
    githubUrl: "https://github.com/freelancer-demo",
    linkedinUrl: "https://www.linkedin.com/in/freelancer-demo",
    education: "Bachelor's degree in Computer Science",
    certifications: "Frontend Web Development Certificate",
  },
  create: {
    userId: user.id,
    professionalTitle: "Frontend Developer",
    bio: "Frontend developer focused on accessible, responsive interfaces and practical product experiences.",
    skills: "HTML, CSS, JavaScript, React, TypeScript, REST APIs, Git, Testing",
    experienceLevel: "INTERMEDIATE",
    hourlyRateUsd: 35,
    country: "India",
    city: "Bengaluru",
    languages: "English, Hindi",
    availability: "PART_TIME",
    preferredWorkingHours: "Evenings and weekends",
    responseTime: "Within 24 hours",
    portfolioUrl: "https://github.com/freelancer-demo",
    githubUrl: "https://github.com/freelancer-demo",
    linkedinUrl: "https://www.linkedin.com/in/freelancer-demo",
    education: "Bachelor's degree in Computer Science",
    certifications: "Frontend Web Development Certificate",
  },
});

console.log({ user, profileId: profile.id, complete: true });
await prisma.$disconnect();