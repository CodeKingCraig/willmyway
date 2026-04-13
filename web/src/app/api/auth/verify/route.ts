export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function GET(req: Request) {
  const appUrl = getAppUrl();

  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.redirect(new URL("/login?verified=0", appUrl));
    }

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        emailVerificationExpiresAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?verified=0", appUrl));
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL("/login?verified=1", appUrl));
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      return NextResponse.redirect(new URL("/login?verified=expired", appUrl));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return NextResponse.redirect(new URL("/login?verified=1", appUrl));
  } catch (err) {
    console.error("VERIFY_EMAIL_ERROR:", err);
    return NextResponse.redirect(new URL("/login?verified=0", appUrl));
  }
}