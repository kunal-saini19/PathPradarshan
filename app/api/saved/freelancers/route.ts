import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


const toggleSchema = z.object({
  freelancerId: z.coerce.number().int().positive(),
});

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (requester?.role !== "CLIENT") {
    return NextResponse.json({ detail: "Only clients can save freelancers" }, { status: 403 });
  }

  const saved = await prisma.savedFreelancer.findMany({
    where: { clientId: userId },
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (requester?.role !== "CLIENT") {
    return NextResponse.json({ detail: "Only clients can save freelancers" }, { status: 403 });
  }

  const parsed = toggleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const freelancer = await prisma.user.findUnique({
    where: { id: parsed.data.freelancerId },
    select: { id: true, role: true },
  });

  if (!freelancer || freelancer.role !== "FREELANCER") {
    return NextResponse.json({ detail: "Freelancer not found" }, { status: 404 });
  }

  const existing = await prisma.savedFreelancer.findUnique({
    where: {
      clientId_freelancerId: {
        clientId: userId,
        freelancerId: parsed.data.freelancerId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedFreelancer.delete({
      where: {
        clientId_freelancerId: {
          clientId: userId,
          freelancerId: parsed.data.freelancerId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  }

  await prisma.savedFreelancer.create({
    data: {
      clientId: userId,
      freelancerId: parsed.data.freelancerId,
    },
  });

  return NextResponse.json({ saved: true }, { status: 201 });
}
