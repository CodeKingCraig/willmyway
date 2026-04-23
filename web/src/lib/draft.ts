import { prisma } from "@/lib/prisma";

export type DraftState =
  | { exists: false }
  | { exists: true; id: string; status: string; step: number; updatedAt: Date };

export async function getDraftStateByUserId(
  userId: string
): Promise<DraftState> {
  const draft = await prisma.willDraft.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      step: true,
      updatedAt: true,
    },
  });

  if (!draft) return { exists: false };

  return {
    exists: true,
    id: draft.id,
    status: draft.status,
    step: draft.step,
    updatedAt: draft.updatedAt,
  };
}
