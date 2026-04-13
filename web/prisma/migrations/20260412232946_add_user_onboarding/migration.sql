-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingAnswers" JSONB,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
