import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase-server";


const tokenSchema = z.object({ token: z.string().min(10) });

async function verifyToken(token: string) {
  let data: { user: { email?: string | null; email_confirmed_at?: string | null } | null };
  let error: { message?: string } | null;

  try {
    const supabase = getSupabaseServerClient();
    const result = await supabase.auth.getUser(token);
    data = result.data;
    error = result.error;
  } catch (clientError) {
    return {
      ok: false,
      detail: clientError instanceof Error ? clientError.message : "Supabase Auth is not configured.",
    };
  }

  if (error || !data.user?.email) {
    return { ok: false, detail: "Invalid or expired verification token." };
  }

  if (!data.user.email_confirmed_at) {
    return { ok: false, detail: "Email is not confirmed yet. Please complete verification from your inbox." };
  }

  await prisma.user.updateMany({
    where: { email: data.user.email },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });

  return { ok: true, detail: "Email verified successfully. You can sign in now." };
}

export async function POST(request: Request) {
  const payload = tokenSchema.parse(await request.json());
  const result = await verifyToken(payload.token);

  if (!result.ok) {
    return NextResponse.json({ detail: result.detail }, { status: 400 });
  }

  return NextResponse.json({ message: result.detail });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const parsed = tokenSchema.safeParse({ token });

  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid verification token." }, { status: 400 });
  }

  const result = await verifyToken(parsed.data.token);

  if (!result.ok) {
    return NextResponse.json({ detail: result.detail }, { status: 400 });
  }

  return NextResponse.json({ message: result.detail });
}
