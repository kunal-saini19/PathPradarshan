import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
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
          username: true,
          name: true,
          email: true,
        },
      },
      hiredFreelancer: {
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
  });

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
