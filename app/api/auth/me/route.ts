import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAccessToken } from "@/lib/auth";


function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const userId = parseAccessToken(token);

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      tokens: true,
      walletAddress: true,
      freelancerProfile: {
        select: {
          id: true,
        },
      },
      clientProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || !user.username) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      tokens: user.tokens,
      walletAddress: user.walletAddress,
      hasFreelancerProfile: !!user.freelancerProfile,
      hasClientProfile: !!user.clientProfile,
    },
  });
}
