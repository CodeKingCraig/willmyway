export const runtime = "nodejs";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const fullName = (body?.fullName ?? "").toString().trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || null,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    let emailSent = false;

    try {
      await sendVerificationEmail({
        to: email,
        fullName: fullName || null,
        token: verificationToken,
      });
      emailSent = true;
    } catch (emailErr) {
      console.error("REGISTER_EMAIL_SEND_ERROR:", emailErr);
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      emailSent,
      user,
    });
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}