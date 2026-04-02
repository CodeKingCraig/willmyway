"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function isOk(payload: unknown): payload is { ok: true; draftId: string; step?: number } {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as { ok?: unknown; draftId?: unknown; step?: unknown };
  return p.ok === true && typeof p.draftId === "string";
}

function getError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as { error?: unknown; message?: unknown };
  if (typeof p.error === "string") return p.error;
  if (typeof p.message === "string") return p.message;
  return fallback;
}

export default function StartWizardButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onStart() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/will/draft", { method: "POST" });
      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getError(payload, "Failed to create draft"));
        setLoading(false);
        return;
      }

      if (!isOk(payload)) {
        setError("Unexpected response from server");
        setLoading(false);
        return;
      }

      // Always enter step 1 on first creation
      router.push("/will/step/1");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Starting..." : "Start Wizard →"}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}