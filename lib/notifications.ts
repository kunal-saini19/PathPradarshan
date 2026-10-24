import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: number;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  email?: string | null;
};

export async function createNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
    },
  });

  // Lightweight email trigger stub for local development.
  if (input.email) {
    console.log(`[email-trigger] to=${input.email} type=${input.type} title=${input.title}`);
  }

  return notification;
}
