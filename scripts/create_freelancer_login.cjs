const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = "Freelancer@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: "freelancer.demo@local.dev" },
    update: {
      name: "Freelancer Demo",
      username: "freelancer_demo",
      role: "FREELANCER",
      passwordHash,
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      tokens: 50,
    },
    create: {
      name: "Freelancer Demo",
      username: "freelancer_demo",
      email: "freelancer.demo@local.dev",
      role: "FREELANCER",
      passwordHash,
      emailVerified: true,
      tokens: 50,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      emailVerified: true,
    },
  });

  console.log(JSON.stringify(user));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
