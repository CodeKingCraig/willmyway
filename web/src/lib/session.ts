import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "OWNER" | "WITNESS" | "ADMIN";
  basePlan: "ESSENTIAL" | "LEGACY" | "FAMILY_VAULT" | "FULL";
  careActive: boolean;
  careStartedAt: Date | null;
  careEndsAt: Date | null;
  careStatus: "NOT_ACTIVE" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  emailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      basePlan: true,
      careActive: true,
      careStartedAt: true,
      careEndsAt: true,
      careStatus: true,
      emailVerified: true,
      onboardingCompleted: true,
      onboardingCompletedAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    basePlan: user.basePlan,
    careActive: user.careActive,
    careStartedAt: user.careStartedAt,
    careEndsAt: user.careEndsAt,
    careStatus: user.careStatus,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    onboardingCompletedAt: user.onboardingCompletedAt,
  };
}