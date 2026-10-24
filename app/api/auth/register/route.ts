import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueAccessToken } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";


const registerSchema = z.object({
  username: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/)
    .regex(/[^A-Za-z0-9]/),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

function appBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid registration payload." }, { status: 400 });
  }
  const payload = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { username: payload.username }],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ detail: "An account with this username or email already exists." }, { status: 409 });
  }

  const emailRedirectTo = `${appBaseUrl(request)}/verify-email`;
  let data: { user: { email_confirmed_at?: string | null } | null; session: object | null };

  try {
    const supabase = getSupabaseServerClient();
    const result = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo,
        data: {
          username: payload.username,
          role: payload.role,
        },
      },
    });

    if (result.error) {
      return NextResponse.json({ detail: result.error.message || "Supabase sign up failed." }, { status: 400 });
    }

    data = result.data;
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Supabase Auth is not configured." },
      { status: 503 },
    );
  }

  const emailVerified = Boolean(data.user?.email_confirmed_at || data.session);

  const user = await prisma.user.upsert({
    where: { email: payload.email },
    update: {
      name: payload.username,
      username: payload.username,
      role: payload.role,
      emailVerified,
    },
    create: {
      name: payload.username,
      username: payload.username,
      email: payload.email,
      passwordHash: null,
      role: payload.role,
      tokens: payload.role === "CLIENT" ? 100 : 50,
      emailVerified,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      walletAddress: true,
    },
  });

  const message = emailVerified
    ? "Registration successful. You can sign in now."
    : "Registration successful. Please verify your email from Supabase before signing in.";

  return NextResponse.json({
    message,
    emailSent: true,
    ...(emailVerified ? { accessToken: issueAccessToken(user.id), user } : {}),
    verificationRequired: !emailVerified,
  }, { status: 201 });
}
