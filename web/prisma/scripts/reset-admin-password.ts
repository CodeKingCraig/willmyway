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
  const newPassword = "KeepSave@2026!";

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("ADMIN PASSWORD RESET:");
  console.log({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    emailVerified: updated.emailVerified,
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