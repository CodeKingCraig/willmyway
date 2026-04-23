export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/auth_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);

    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
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
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("ME_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
