import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";
import { TOKEN_PRICE_INR, WEB3_NETWORK_NAME } from "@/lib/tokenomics";


const createProposalSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  coverLetter: z.string().trim().min(10),
});

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const jobId = Number(url.searchParams.get("jobId") || "0");

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ detail: "jobId query param is required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, clientId: true },
  });

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!requester) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  if (job.clientId !== requester.id && requester.role !== "ADMIN") {
    return NextResponse.json({ detail: "Only the job owner can view proposals" }, { status: 403 });
  }

  const proposals = await prisma.proposal.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          walletAddress: true,
        },
      },
    },
  });

  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const freelancer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, username: true, tokens: true, walletAddress: true },
  });

  if (!freelancer) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  if (freelancer.role !== "FREELANCER") {
    return NextResponse.json({ detail: "Only freelancers can apply" }, { status: 403 });
  }

  const payload = createProposalSchema.parse(await request.json());

  const job = await prisma.job.findUnique({
    where: { id: payload.jobId },
    select: {
      id: true,
      title: true,
      applicationTokenCost: true,
      clientId: true,
      client: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  if (job.clientId === freelancer.id) {
    return NextResponse.json({ detail: "You cannot apply to your own job" }, { status: 400 });
  }

  const existing = await prisma.proposal.findUnique({
    where: {
      jobId_freelancerId: {
        jobId: payload.jobId,
        freelancerId: freelancer.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ detail: "You already applied to this job" }, { status: 409 });
  }

  if (!Number.isInteger(job.applicationTokenCost) || job.applicationTokenCost <= 0) {
    return NextResponse.json(
      { detail: "Job apply fee is not configured. Please ask client to republish this job." },
      { status: 409 },
    );
  }

  const tokenCost = job.applicationTokenCost;

  if (freelancer.tokens < tokenCost) {
    return NextResponse.json(
      {
        detail: `Insufficient tokens. You need ${tokenCost} tokens to apply and currently have ${freelancer.tokens}.`,
      },
      { status: 402 },
    );
  }

  const txHash = `0x${crypto.randomBytes(12).toString("hex")}${Date.now().toString(16)}`;

  let result: {
    proposal: any;
    remainingTokens: number;
    walletAddress: string | null;
    transaction: {
      txHash: string;
      tokenAmount: number;
      tokenPriceInr: number;
      totalInr: number;
      status: string;
      network: string;
      createdAt: Date;
    };
  };

  try {
    result = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: {
          id: freelancer.id,
          tokens: { gte: tokenCost },
        },
        data: {
          tokens: { decrement: tokenCost },
        },
      });

      if (debit.count === 0) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      const proposal = await tx.proposal.create({
        data: {
          jobId: payload.jobId,
          freelancerId: freelancer.id,
          coverLetter: payload.coverLetter,
          status: "SUBMITTED",
        },
        include: {
          freelancer: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const wallet = await tx.user.findUnique({
        where: { id: freelancer.id },
        select: { tokens: true, walletAddress: true },
      });

      const tokenTx = await tx.tokenTransaction.create({
        data: {
          txHash,
          userId: freelancer.id,
          jobId: job.id,
          proposalId: proposal.id,
          type: "JOB_APPLY_DEBIT",
          tokenAmount: tokenCost,
          tokenPriceInr: TOKEN_PRICE_INR,
          totalInr: tokenCost * TOKEN_PRICE_INR,
          status: "CONFIRMED",
          network: WEB3_NETWORK_NAME,
        },
        select: {
          txHash: true,
          tokenAmount: true,
          tokenPriceInr: true,
          totalInr: true,
          status: true,
          network: true,
          createdAt: true,
        },
      });

      return {
        proposal,
        remainingTokens: wallet?.tokens ?? 0,
        walletAddress: wallet?.walletAddress || null,
        transaction: tokenTx,
      };
    });
  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        {
          detail: `Insufficient tokens. You need ${tokenCost} tokens to apply and currently have ${freelancer.tokens}.`,
        },
        { status: 402 },
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json({ detail: "You already applied to this job" }, { status: 409 });
    }

    throw error;
  }

  await createNotification({
    userId: job.clientId,
    type: "PROPOSAL_SUBMITTED",
    title: "New job application",
    body: `${freelancer.username || "A freelancer"} applied to ${job.title}.`,
    link: `/dashboard?proposalId=${result.proposal.id}`,
    email: job.client.email,
  });

  return NextResponse.json(
    {
      proposal: result.proposal,
      tokenDebit: {
        tokenCost: result.transaction.tokenAmount,
        tokenPriceInr: result.transaction.tokenPriceInr,
        totalInr: result.transaction.totalInr,
        remainingTokens: result.remainingTokens,
        walletAddress: result.walletAddress,
        network: result.transaction.network,
        txHash: result.transaction.txHash,
        status: result.transaction.status,
        blockTimestamp: result.transaction.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
