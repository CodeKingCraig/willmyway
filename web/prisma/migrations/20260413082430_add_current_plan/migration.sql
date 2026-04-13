-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('ESSENTIAL', 'LEGACY', 'FAMILY_VAULT', 'CARE', 'FULL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPlan" "UserPlan" NOT NULL DEFAULT 'ESSENTIAL';
