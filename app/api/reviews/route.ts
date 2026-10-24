import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";


const createReviewSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(800),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = Number(url.searchParams.get("jobId") || "0");
  const targetUserId = Number(url.searchParams.get("targetUserId") || "0");

  if (!jobId && !targetUserId) {
    return NextResponse.json({ detail: "Provide jobId or targetUserId" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      ...(jobId > 0 ? { jobId } : {}),
      ...(targetUserId > 0 ? { targetUserId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const parsed = createReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    include: {
      client: {
        select: {
          id: true,
          email: true,
        },
      },
      hiredFreelancer: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  if (job.status !== "COMPLETED") {
    return NextResponse.json({ detail: "Reviews are allowed only after project completion" }, { status: 409 });
  }

  if (!job.hiredFreelancerId) {
    return NextResponse.json({ detail: "No hired freelancer found for this job" }, { status: 409 });
  }

  const allowed = userId === job.clientId || userId === job.hiredFreelancerId;
  if (!allowed) {
    return NextResponse.json({ detail: "Only project participants can review" }, { status: 403 });
  }

  const targetUserId = userId === job.clientId ? job.hiredFreelancerId : job.clientId;

  const existing = await prisma.review.findUnique({
    where: {
      jobId_authorId: {
        jobId: job.id,
        authorId: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return NextResponse.json({ detail: "You already reviewed this project" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      jobId: job.id,
      authorId: userId,
      targetUserId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });

  await createNotification({
    userId: targetUserId,
    type: "REVIEW",
    title: "New project review",
    body: `You received a ${parsed.data.rating}/5 review for a completed project.`,
    email: userId === job.clientId ? job.hiredFreelancer?.email : job.client.email,
  });

  return NextResponse.json({ review }, { status: 201 });
}
