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
  const email = "admin@keepsave.co.za";
  const password = "KeepSave@2026!";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      emailVerified: true,
      basePlan: true,
      careActive: true,
      careStatus: true,
      createdAt: true,
      updatedAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    console.log("USER NOT FOUND");
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  console.log({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: user.emailVerified,
    basePlan: user.basePlan,
    careActive: user.careActive,
    careStatus: user.careStatus,
    passwordMatches,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
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