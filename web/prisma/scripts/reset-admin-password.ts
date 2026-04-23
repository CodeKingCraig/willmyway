import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      basePlan: "FULL",
      careActive: false,
      careStatus: "NOT_ACTIVE",
      careStartedAt: null,
      careEndsAt: null,
    },
  });

  console.log("PASSWORD RESET OK");
  console.log(updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });