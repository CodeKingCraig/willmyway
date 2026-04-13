import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email = "admin@willmyway.co.za";
  const password = "W1LLmYW@Y";
  const fullName = "WillMyWay Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        fullName,
        passwordHash,
        role: "ADMIN",
        emailVerified: true,
        basePlan: "FULL",
        careActive: false,
        careStatus: "NOT_ACTIVE",
        careStartedAt: null,
        careEndsAt: null,
      },
    });

    console.log("UPDATED ADMIN:");
    console.log(updated);
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "ADMIN",
      emailVerified: true,
      onboardingCompleted: false,
      basePlan: "FULL",
      careActive: false,
      careStatus: "NOT_ACTIVE",
    },
  });

  console.log("CREATED ADMIN:");
  console.log(created);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });