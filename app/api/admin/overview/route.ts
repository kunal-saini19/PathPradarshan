import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!requester) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  if (requester.role !== "ADMIN") {
    return NextResponse.json({ detail: "Only admin can view this data" }, { status: 403 });
  }

  const [usersCount, jobsCount, proposalsCount, users, jobs, proposals] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.proposal.count(),
    prisma.user.findMany({
      orderBy: { id: "desc" },
      take: 8,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        tokens: true,
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        budget: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    }),
    prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        coverLetter: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    counts: {
      users: usersCount,
      jobs: jobsCount,
      proposals: proposalsCount,
    },
    users,
    jobs,
    proposals,
  });
}
