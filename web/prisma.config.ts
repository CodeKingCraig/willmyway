import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7+ reads the connection URL from prisma.config.ts (not schema.prisma)
    url: process.env.DATABASE_URL!,
  },
});