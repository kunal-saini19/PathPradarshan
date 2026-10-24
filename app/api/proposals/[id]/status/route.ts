import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";

const updateProposalStatusSchema = z.object({
  status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    return NextResponse.json({ detail: "Invalid proposal id" }, { status: 400 });
  }

  const parsed = updateProposalStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          clientId: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!proposal) {
    return NextResponse.json({ detail: "Proposal not found" }, { status: 404 });
  }

  if (proposal.job.clientId !== userId) {
    return NextResponse.json({ detail: "Only the job owner can update proposal status" }, { status: 403 });
  }

  const nextStatus = parsed.data.status;

  const result = await prisma.$transaction(async (tx) => {
    if (nextStatus === "ACCEPTED") {
      await tx.proposal.updateMany({
        where: {
          jobId: proposal.jobId,
          id: { not: proposal.id },
          status: { in: ["SUBMITTED", "SHORTLISTED"] },
        },
        data: { status: "REJECTED" },
      });

      await tx.job.update({
        where: { id: proposal.jobId },
        data: {
          status: "ACCEPTED",
          hiredFreelancerId: proposal.freelancerId,
        },
      });
    }

    const updated = await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: nextStatus },
      include: {
        freelancer: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  });

  await createNotification({
    userId: proposal.freelancerId,
    type: "PROPOSAL_STATUS",
    title: `Proposal ${nextStatus.toLowerCase()}`,
    body: `Your proposal for \"${proposal.job.title}\" is now ${nextStatus.toLowerCase()}.`,
    email: proposal.freelancer.email,
  });

  return NextResponse.json({ proposal: result });
}
