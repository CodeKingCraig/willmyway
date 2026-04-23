export const runtime = "nodejs";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email ?? "").toString().trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      token: resetToken,
    });

    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("FORGOT_PASSWORD_ERROR:", err);
    return NextResponse.json(
      { error: "Could not process password reset request." },
      { status: 500 }
    );
  }
}
