import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ detail: "Invalid job id" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
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

  if (job.clientId !== userId) {
    return NextResponse.json({ detail: "Only the job owner can complete project" }, { status: 403 });
  }

  if (!["IN_PROGRESS", "ACCEPTED"].includes(job.status)) {
    return NextResponse.json({ detail: "Only accepted or in-progress projects can be completed" }, { status: 409 });
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  if (job.hiredFreelancerId) {
    await createNotification({
      userId: job.hiredFreelancerId,
      type: "PROJECT_COMPLETED",
      title: "Project marked completed",
      body: `The client marked ${job.title} as completed. You can now submit your review.`,
      email: job.hiredFreelancer?.email,
    });
  }

  return NextResponse.json({ job: updated });
}
