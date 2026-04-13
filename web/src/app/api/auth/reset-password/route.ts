export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const token = (body?.token ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        passwordResetExpiresAt: true,
      },
    });

    if (!user || !user.passwordResetExpiresAt) {
      return NextResponse.json(
        { error: "This reset link is invalid." },
        { status: 400 }
      );
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This reset link has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("RESET_PASSWORD_ERROR:", err);
    return NextResponse.json(
      { error: "Could not reset password." },
      { status: 500 }
    );
  }
}