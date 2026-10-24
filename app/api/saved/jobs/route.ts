import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


const toggleSchema = z.object({
  jobId: z.coerce.number().int().positive(),
});

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const parsed = toggleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  const existing = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId: parsed.data.jobId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId,
          jobId: parsed.data.jobId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  }

  await prisma.savedJob.create({
    data: {
      userId,
      jobId: parsed.data.jobId,
    },
  });

  return NextResponse.json({ saved: true }, { status: 201 });
}
