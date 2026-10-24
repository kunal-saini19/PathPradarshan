import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";


const markSchema = z.object({
  notificationId: z.coerce.number().int().positive().optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || "30")));

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const parsed = markSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  }

  if (!parsed.data.notificationId) {
    return NextResponse.json({ detail: "notificationId is required" }, { status: 400 });
  }

  const updated = await prisma.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

  if (!updated.count) {
    return NextResponse.json({ detail: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
