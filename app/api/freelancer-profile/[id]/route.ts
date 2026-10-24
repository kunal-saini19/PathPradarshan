import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const viewerId = getAuthenticatedUserId(request);
  if (!viewerId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const freelancerId = Number(id);

  if (!Number.isInteger(freelancerId) || freelancerId <= 0) {
    return NextResponse.json({ detail: "Invalid freelancer id" }, { status: 400 });
  }

  const freelancer = await prisma.user.findFirst({
    where: {
      id: freelancerId,
      role: "FREELANCER",
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      tokens: true,
      freelancerProfile: true,
      _count: {
        select: {
          proposals: true,
          receivedReviews: true,
        },
      },
    },
  });

  if (!freelancer) {
    return NextResponse.json({ detail: "Freelancer not found" }, { status: 404 });
  }

  const [acceptedProposals, completedProjects, ratingAggregate] = await Promise.all([
    prisma.proposal.count({
      where: {
        freelancerId,
        status: "ACCEPTED",
      },
    }),
    prisma.job.count({
      where: {
        hiredFreelancerId: freelancerId,
        status: "COMPLETED",
      },
    }),
    prisma.review.aggregate({
      where: { targetUserId: freelancerId },
      _avg: { rating: true },
    }),
  ]);

  return NextResponse.json({
    profile: {
      ...freelancer,
      stats: {
        acceptedProposals,
        completedProjects,
        averageRating: ratingAggregate._avg.rating ?? 0,
      },
    },
  });
}
