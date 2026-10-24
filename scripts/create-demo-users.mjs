import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = "Demo@1234";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: "freelancer.demo@2gathers.dev" },
    update: {
      name: "Demo Freelancer",
      username: "freelancer_demo",
      role: "FREELANCER",
      tokens: 250,
      passwordHash,
      emailVerified: true,
    },
    create: {
      name: "Demo Freelancer",
      username: "freelancer_demo",
      email: "freelancer.demo@2gathers.dev",
      role: "FREELANCER",
      tokens: 250,
      passwordHash,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "client.demo@2gathers.dev" },
    update: {
      name: "Demo Client",
      username: "client_demo",
      role: "CLIENT",
      tokens: 500,
      passwordHash,
      emailVerified: true,
    },
    create: {
      name: "Demo Client",
      username: "client_demo",
      email: "client.demo@2gathers.dev",
      role: "CLIENT",
      tokens: 500,
      passwordHash,
      emailVerified: true,
    },
  });

  console.log("Demo users ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
