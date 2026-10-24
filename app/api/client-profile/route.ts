import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


const clientProfileSchema = z.object({
  accountType: z.enum(["INDIVIDUAL", "COMPANY"]),
  displayName: z.string().trim().min(3),
  companyName: z.string().trim().optional().or(z.literal("")),
  about: z.string().trim().min(80),
  companySize: z.enum(["SOLO", "SMALL", "MID", "LARGE", "ENTERPRISE"]),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  country: z.string().trim().min(2),
  timezone: z.string().trim().min(2),
  phone: z.string().trim().regex(/^\+[1-9]\d{1,3}[\s-]?\d{6,14}$/, "Phone must start with country code like +91").optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  preferredLanguages: z.string().trim().min(2),
  budgetRange: z.enum(["UNDER_1K", "ONE_TO_FIVE_K", "FIVE_TO_TEN_K", "TEN_PLUS"]),
  hiringGoals: z.string().trim().min(40),
  communicationPreference: z.enum(["CHAT_EMAIL", "VIDEO_CALLS", "FLEXIBLE"]),
  responseExpectation: z.enum(["WITHIN_24H", "WITHIN_3_DAYS", "FLEXIBLE"]),
});

async function getClientUser(request: Request) {
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

  if (String(user.role || "").toUpperCase() !== "CLIENT") {
    return { error: NextResponse.json({ detail: "Only clients can manage this profile" }, { status: 403 }) };
  }

  return { user };
}

export async function GET(request: Request) {
  const auth = await getClientUser(request);
  if (auth.error) return auth.error;

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: auth.user.id },
  });

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const auth = await getClientUser(request);
  if (auth.error) return auth.error;

  const parsed = clientProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid profile payload" }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.accountType === "COMPANY" && !payload.companyName?.trim()) {
    return NextResponse.json({ detail: "Company name is required for company accounts" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.upsert({
    where: { userId: auth.user.id },
    update: {
      accountType: payload.accountType,
      displayName: payload.displayName,
      companyName: payload.companyName || null,
      about: payload.about,
      companySize: payload.companySize,
      websiteUrl: payload.websiteUrl || null,
      country: payload.country,
      timezone: payload.timezone,
      phone: payload.phone || null,
      linkedinUrl: payload.linkedinUrl || null,
      preferredLanguages: payload.preferredLanguages,
      budgetRange: payload.budgetRange,
      hiringGoals: payload.hiringGoals,
      communicationPreference: payload.communicationPreference,
      responseExpectation: payload.responseExpectation,
    },
    create: {
      userId: auth.user.id,
      accountType: payload.accountType,
      displayName: payload.displayName,
      companyName: payload.companyName || null,
      about: payload.about,
      companySize: payload.companySize,
      websiteUrl: payload.websiteUrl || null,
      country: payload.country,
      timezone: payload.timezone,
      phone: payload.phone || null,
      linkedinUrl: payload.linkedinUrl || null,
      preferredLanguages: payload.preferredLanguages,
      budgetRange: payload.budgetRange,
      hiringGoals: payload.hiringGoals,
      communicationPreference: payload.communicationPreference,
      responseExpectation: payload.responseExpectation,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
