import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload?.userId) return null;

  return payload.userId as string;
}

type DraftStatus = "DRAFT" | "LOCKED";

type PatchBody = {
  step?: number;
  data?: unknown;
  status?: DraftStatus;
};

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const draft = await prisma.willDraft.findUnique({
    where: { userId },
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

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.willDraft.findUnique({
    where: { userId },
    select: { id: true, step: true, status: true },
  });

  if (existing) {
    return NextResponse.json(
      { ok: true, draftId: existing.id, step: existing.step, status: existing.status },
      { status: 200 }
    );
  }

  const created = await prisma.willDraft.create({
    data: {
      userId,
      status: "DRAFT",
      step: 1,
      data: {} as Prisma.InputJsonValue,
    },
    select: { id: true, step: true, status: true },
  });

  return NextResponse.json(
    { ok: true, draftId: created.id, step: created.step, status: created.status },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    where: { userId },
    select: { id: true, data: true, step: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // If draft is locked, block edits unless explicitly unlocking to DRAFT
  const isLocked = existing.status === "LOCKED";
  const isUnlocking = status === "DRAFT";

  if (isLocked && !isUnlocking) {
    // Allow "no-op" PATCH? We block any attempt to modify step/data while locked.
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
  const nextStatus: DraftStatus = status !== undefined ? status : (existing.status as DraftStatus);

  const updated = await prisma.willDraft.update({
    where: { userId },
    data: {
      data: nextDataObj as Prisma.InputJsonValue,
      step: nextStep,
      status: nextStatus,
    },
    select: { id: true, step: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, updated }, { status: 200 });
}