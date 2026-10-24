import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "freelancer.demo@2gathers.dev" },
    update: {
      name: "Freelancer Demo",
      username: "freelancer_demo",
      role: "FREELANCER",
      emailVerified: true,
      passwordHash,
      tokens: 200,
    },
    create: {
      name: "Freelancer Demo",
      username: "freelancer_demo",
      email: "freelancer.demo@2gathers.dev",
      role: "FREELANCER",
      emailVerified: true,
      passwordHash,
      tokens: 200,
    },
  });

  console.log("READY", {
    id: user.id,
    username: user.username,
    email: user.email,
    password: "Demo@1234",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
