import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Prisma } from "@prisma/client";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

type DraftStatus = "DRAFT" | "LOCKED";

type PatchBody = {
  step?: number;
  data?: unknown;
  status?: DraftStatus;
};

async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!user.emailVerified) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      ),
    };
  }

  if (!user.onboardingCompleted) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "ONBOARDING_INCOMPLETE" },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

export async function GET(_req: NextRequest) {
  const { user, response } = await requireSessionUser();
  if (!user) {
    return response!;
  }

  const draft = await prisma.willDraft.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      status: true,
      step: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, draft }, { status: 200 });
}

export async function POST(_req: NextRequest) {
  const { user, response } = await requireSessionUser();
  if (!user) {
    return response!;
  }

  const existing = await prisma.willDraft.findUnique({
    where: { userId: user.id },
    select: { id: true, step: true, status: true },
  });

  if (existing) {
    return NextResponse.json(
      {
        ok: true,
        draftId: existing.id,
        step: existing.step,
        status: existing.status,
      },
      { status: 200 }
    );
  }

  const created = await prisma.willDraft.create({
    data: {
      userId: user.id,
      status: "DRAFT",
      step: 1,
      data: {} as Prisma.InputJsonValue,
    },
    select: { id: true, step: true, status: true },
  });

  return NextResponse.json(
    {
      ok: true,
      draftId: created.id,
      step: created.step,
      status: created.status,
    },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireSessionUser();
  if (!user) {
    return response!;
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { step, data, status } = body as PatchBody;

  if (step !== undefined) {
    if (
      typeof step !== "number" ||
      !Number.isInteger(step) ||
      step < 1 ||
      step > 50
    ) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }
  }

  if (data !== undefined && !isObject(data)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (status !== undefined && status !== "DRAFT" && status !== "LOCKED") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.willDraft.findUnique({
    where: { userId: user.id },
    select: { id: true, data: true, step: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const isLocked = existing.status === "LOCKED";
  const isUnlocking = status === "DRAFT";

  if (isLocked && !isUnlocking) {
    if (step !== undefined || data !== undefined || status === "LOCKED") {
      return NextResponse.json(
        { error: "Draft is locked. Unlock to edit." },
        { status: 423 }
      );
    }
  }

  const nextDataObj: Record<string, unknown> =
    data !== undefined
      ? (data as Record<string, unknown>)
      : isObject(existing.data)
      ? (existing.data as Record<string, unknown>)
      : {};

  const nextStep: number = step !== undefined ? step : existing.step;
  const nextStatus: DraftStatus =
    status !== undefined ? status : (existing.status as DraftStatus);

  const updated = await prisma.willDraft.update({
    where: { userId: user.id },
    data: {
      data: nextDataObj as Prisma.InputJsonValue,
      step: nextStep,
      status: nextStatus,
    },
    select: { id: true, step: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, updated }, { status: 200 });
}
