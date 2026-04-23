export const runtime = "nodejs";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

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
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email exists, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "This email is already verified.",
      });
    }

    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      token: verificationToken,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent.",
    });
  } catch (err) {
    console.error("RESEND_VERIFICATION_ERROR:", err);
    return NextResponse.json(
      { error: "Could not resend verification email." },
      { status: 500 }
    );
  }
}
