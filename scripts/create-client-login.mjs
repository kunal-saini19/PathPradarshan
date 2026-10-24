import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "client.demo@2gathers.dev" },
    update: {
      name: "Client Demo",
      username: "client_demo",
      role: "CLIENT",
      emailVerified: true,
      passwordHash,
      tokens: 300,
    },
    create: {
      name: "Client Demo",
      username: "client_demo",
      email: "client.demo@2gathers.dev",
      role: "CLIENT",
      emailVerified: true,
      passwordHash,
      tokens: 300,
    },
  });

  console.log("READY", { id: user.id, username: user.username, email: user.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
