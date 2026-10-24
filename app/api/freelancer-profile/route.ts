import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


const freelancerProfileSchema = z.object({
  professionalTitle: z.string().trim().min(5),
  bio: z.string().trim().min(80),
  skills: z.string().trim().min(3),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]),
  hourlyRateUsd: z.coerce.number().int().positive(),
  country: z.string().trim().min(2),
  city: z.string().trim().min(2),
  phone: z.string().trim().optional().or(z.literal("")),
  languages: z.string().trim().min(2),
  portfolioUrl: z.string().trim().url().optional().or(z.literal("")),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  education: z.string().trim().optional().or(z.literal("")),
  certifications: z.string().trim().optional().or(z.literal("")),
  availability: z.enum(["FULL_TIME", "PART_TIME", "AS_NEEDED"]),
  preferredWorkingHours: z.string().trim().optional().or(z.literal("")),
  responseTime: z.enum(["WITHIN_HOUR", "WITHIN_DAY", "WITHIN_2_DAYS"]),
});

async function getFreelancerUser(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return { error: NextResponse.json({ detail: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { error: NextResponse.json({ detail: "User not found" }, { status: 404 }) };
  }

  if (String(user.role || "").toUpperCase() !== "FREELANCER") {
    return { error: NextResponse.json({ detail: "Only freelancers can manage this profile" }, { status: 403 }) };
  }

  return { user };
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await getFreelancerUser(request);
  if (auth.error) return auth.error;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: auth.user.id },
  });

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const auth = await getFreelancerUser(request);
  if (auth.error) return auth.error;

  const parsed = freelancerProfileSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid profile payload" }, { status: 400 });
  }

  const payload = parsed.data;

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: auth.user.id },
    update: {
      professionalTitle: payload.professionalTitle,
      bio: payload.bio,
      skills: payload.skills,
      experienceLevel: payload.experienceLevel,
      hourlyRateUsd: payload.hourlyRateUsd,
      country: payload.country,
      city: payload.city,
      phone: payload.phone || null,
      languages: payload.languages,
      portfolioUrl: payload.portfolioUrl || null,
      githubUrl: payload.githubUrl || null,
      linkedinUrl: payload.linkedinUrl || null,
      education: payload.education || null,
      certifications: payload.certifications || null,
      availability: payload.availability,
      preferredWorkingHours: payload.preferredWorkingHours || null,
      responseTime: payload.responseTime,
    },
    create: {
      userId: auth.user.id,
      professionalTitle: payload.professionalTitle,
      bio: payload.bio,
      skills: payload.skills,
      experienceLevel: payload.experienceLevel,
      hourlyRateUsd: payload.hourlyRateUsd,
      country: payload.country,
      city: payload.city,
      phone: payload.phone || null,
      languages: payload.languages,
      portfolioUrl: payload.portfolioUrl || null,
      githubUrl: payload.githubUrl || null,
      linkedinUrl: payload.linkedinUrl || null,
      education: payload.education || null,
      certifications: payload.certifications || null,
      availability: payload.availability,
      preferredWorkingHours: payload.preferredWorkingHours || null,
      responseTime: payload.responseTime,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
