import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";


const createMessageSchema = z.object({
  proposalId: z.coerce.number().int().positive(),
  body: z.string().trim().min(1).max(1500),
});

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const proposalId = Number(url.searchParams.get("proposalId") || "0");

  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    return NextResponse.json({ detail: "proposalId query param is required" }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        select: {
          clientId: true,
        },
      },
    },
  });

  if (!proposal) {
    return NextResponse.json({ detail: "Proposal not found" }, { status: 404 });
  }

  const allowed = userId === proposal.freelancerId || userId === proposal.job.clientId;
  if (!allowed) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { proposalId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const parsed = createMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          clientId: true,
          client: {
            select: {
              email: true,
            },
          },
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

  const isClient = userId === proposal.job.clientId;
  const isFreelancer = userId === proposal.freelancerId;
  if (!isClient && !isFreelancer) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const receiverId = isClient ? proposal.freelancerId : proposal.job.clientId;

  const message = await prisma.message.create({
    data: {
      proposalId: proposal.id,
      senderId: userId,
      receiverId,
      body: parsed.data.body,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
  });

  const targetEmail = isClient ? proposal.freelancer.email : proposal.job.client.email;
  await createNotification({
    userId: receiverId,
    type: "MESSAGE",
    title: "New message",
    body: `You received a new message on ${proposal.job.title}.`,
    email: targetEmail,
  });

  return NextResponse.json({ message }, { status: 201 });
}
