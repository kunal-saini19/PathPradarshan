import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";


const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  tokens: z.coerce.number().int().nonnegative().default(0),
});

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const payload = createUserSchema.parse(await request.json());
  const user = await prisma.user.create({ data: payload });
  return NextResponse.json({ user }, { status: 201 });
}
