import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type OnboardingAnswers = {
  priority: string;
  lettersIntent: string;
  dependants: string;
  completionTiming: string;
  supportNeed: string;
};

function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload?.userId) return null;

  return payload.userId as string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isAllowedString(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

const PRIORITY_OPTIONS = [
  "Protecting my family",
  "Avoiding conflict",
  "Leaving clarity",
  "Building a legacy",
  "Peace of mind",
] as const;

const LETTERS_INTENT_OPTIONS = [
  "Yes, definitely",
  "Maybe later",
  "Not right now",
] as const;

const DEPENDANTS_OPTIONS = [
  "Yes",
  "No",
  "Prefer not to say",
] as const;

const COMPLETION_TIMING_OPTIONS = [
  "Today",
  "This week",
  "This month",
  "I’m just exploring",
] as const;

const SUPPORT_NEED_OPTIONS = [
  "Guidance",
  "Simplicity",
  "Legal confidence",
  "Secure storage",
  "Family planning tools",
] as const;

function parseAnswers(body: unknown): OnboardingAnswers | null {
  if (!isObject(body)) return null;

  const priority = body.priority;
  const lettersIntent = body.lettersIntent;
  const dependants = body.dependants;
  const completionTiming = body.completionTiming;
  const supportNeed = body.supportNeed;

  if (!isAllowedString(priority, PRIORITY_OPTIONS)) return null;
  if (!isAllowedString(lettersIntent, LETTERS_INTENT_OPTIONS)) return null;
  if (!isAllowedString(dependants, DEPENDANTS_OPTIONS)) return null;
  if (!isAllowedString(completionTiming, COMPLETION_TIMING_OPTIONS)) return null;
  if (!isAllowedString(supportNeed, SUPPORT_NEED_OPTIONS)) return null;

  return {
    priority,
    lettersIntent,
    dependants,
    completionTiming,
    supportNeed,
  };
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const answers = parseAnswers(body);

  if (!answers) {
    return NextResponse.json(
      { error: "Invalid onboarding answers" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      onboardingCompleted: true,
    },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (!existingUser.onboardingCompleted) {
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: now,
          onboardingAnswers: answers as Prisma.InputJsonValue,
        },
      });
    }

    const existingDraft = await tx.willDraft.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingDraft) {
      await tx.willDraft.create({
        data: {
          userId,
          status: "DRAFT",
          step: 1,
          data: {} as Prisma.InputJsonValue,
        },
      });
    }
  });

  return NextResponse.json(
    {
      ok: true,
      redirectTo: "/will/step/1",
    },
    { status: 200 }
  );
}