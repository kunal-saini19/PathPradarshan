import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const freelancers = await prisma.user.findMany({
    where: { role: "FREELANCER" },
    select: {
      id: true,
      username: true,
      name: true,
      tokens: true,
      freelancerProfile: {
        select: {
          professionalTitle: true,
          skills: true,
          experienceLevel: true,
          hourlyRateUsd: true,
          country: true,
          city: true,
        },
      },
      _count: {
        select: {
          proposals: true,
          receivedReviews: true,
        },
      },
    },
    orderBy: [
      { tokens: "desc" },
      { id: "asc" },
    ],
  });

  return NextResponse.json({ freelancers });
}
