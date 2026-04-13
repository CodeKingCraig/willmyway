/*
  Warnings:

  - You are about to drop the column `currentPlan` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BasePlan" AS ENUM ('ESSENTIAL', 'LEGACY', 'FAMILY_VAULT', 'FULL');

-- CreateEnum
CREATE TYPE "CareStatus" AS ENUM ('NOT_ACTIVE', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentPlan",
ADD COLUMN     "basePlan" "BasePlan" NOT NULL DEFAULT 'ESSENTIAL',
ADD COLUMN     "careActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "careEndsAt" TIMESTAMP(3),
ADD COLUMN     "careStartedAt" TIMESTAMP(3),
ADD COLUMN     "careStatus" "CareStatus" NOT NULL DEFAULT 'NOT_ACTIVE';

-- DropEnum
DROP TYPE "UserPlan";
