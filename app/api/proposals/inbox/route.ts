import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  const proposals = await prisma.proposal.findMany({
    where:
      user.role === "CLIENT"
        ? {
            job: {
              clientId: userId,
            },
          }
        : {
            freelancerId: userId,
          },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          budget: true,
          status: true,
          completedAt: true,
          createdAt: true,
          clientId: true,
          client: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          walletAddress: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({ proposals });
}
