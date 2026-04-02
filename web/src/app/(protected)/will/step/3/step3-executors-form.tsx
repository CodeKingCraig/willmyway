"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Executor = {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
};

type ExecutorsData = {
  primary?: Partial<Executor>;
  alternate?: Partial<Executor>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeExecutor(value: unknown): Partial<Executor> {
  if (!isObject(value)) return {};
  return {
    fullName: typeof value.fullName === "string" ? value.fullName : undefined,
    idNumber: typeof value.idNumber === "string" ? value.idNumber : undefined,
    email: typeof value.email === "string" ? value.email : undefined,
    phone: typeof value.phone === "string" ? value.phone : undefined,
  };
}

function safeExecutorsFromDraftData(data: unknown): ExecutorsData {
  if (!isObject(data)) return {};
  const ex = data.executors;
  if (!isObject(ex)) return {};
  return {
    primary: safeExecutor(ex.primary),
    alternate: safeExecutor(ex.alternate),
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function Step3ExecutorsForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftData, setDraftData] = useState<unknown>({});

  const [primary, setPrimary] = useState<Executor>({
    fullName: "",
    idNumber: "",
    email: "",
    phone: "",
  });

  const [alternate, setAlternate] = useState<Executor>({
    fullName: "",
    idNumber: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    return primary.fullName.trim().length >= 3;
  }, [primary.fullName]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/will/draft");
        const json: unknown = await res.json();

        if (!res.ok) {
          setError("Failed to load draft.");
          setLoading(false);
          return;
        }

        if (!isObject(json) || !isObject(json.draft)) {
          setError("Draft response is invalid.");
          setLoading(false);
          return;
        }

        const draft = json.draft as Record<string, unknown>;
        const data = draft.data;

        setDraftData(data);

        const ex = safeExecutorsFromDraftData(data);

        if (ex.primary) {
          setPrimary({
            fullName: ex.primary.fullName ?? "",
            idNumber: ex.primary.idNumber ?? "",
            email: ex.primary.email ?? "",
            phone: ex.primary.phone ?? "",
          });
        }

        if (ex.alternate) {
          setAlternate({
            fullName: ex.alternate.fullName ?? "",
            idNumber: ex.alternate.idNumber ?? "",
            email: ex.alternate.email ?? "",
            phone: ex.alternate.phone ?? "",
          });
        }

        setLoading(false);
      } catch {
        setError("Network error.");
        setLoading(false);
      }
    }

    load();
  }, []);

  async function onSave(nextStep: number | null) {
    setSaving(true);
    setError(null);

    try {
      const merged = {
        ...(isObject(draftData) ? draftData : {}),
        executors: {
          primary,
          alternate,
        },
      };

      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: nextStep ?? 3,
        }),
      });

      if (!res.ok) {
        setError("Failed to save.");
        setSaving(false);
        return;
      }

      setSaving(false);

      if (nextStep !== null) {
        router.push(`/will/step/${nextStep}`);
      }
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
        Loading your draft…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PRIMARY */}
      <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
        <div className="text-base font-semibold text-slate-900">
          Primary Executor
        </div>
        <div className="mt-2 text-sm text-slate-600">
          This person will be responsible for carrying out your will.
        </div>

        <div className="mt-5 grid gap-5">
          <Field label="Full Name">
            <input
              value={primary.fullName}
              onChange={(e) =>
                setPrimary({ ...primary, fullName: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              placeholder="e.g. John Smith"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="ID / Passport">
              <input
                value={primary.idNumber}
                onChange={(e) =>
                  setPrimary({ ...primary, idNumber: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>

            <Field label="Phone">
              <input
                value={primary.phone}
                onChange={(e) =>
                  setPrimary({ ...primary, phone: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>
          </div>

          <Field label="Email">
            <input
              value={primary.email}
              onChange={(e) =>
                setPrimary({ ...primary, email: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>
        </div>
      </div>

      {/* ALTERNATE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-base font-semibold text-slate-900">
          Alternate Executor (Optional)
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Backup in case your primary executor is unavailable.
        </div>

        <div className="mt-5 grid gap-5">
          <Field label="Full Name">
            <input
              value={alternate.fullName}
              onChange={(e) =>
                setAlternate({ ...alternate, fullName: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="ID / Passport">
              <input
                value={alternate.idNumber}
                onChange={(e) =>
                  setAlternate({ ...alternate, idNumber: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>

            <Field label="Phone">
              <input
                value={alternate.phone}
                onChange={(e) =>
                  setAlternate({ ...alternate, phone: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>
          </div>

          <Field label="Email">
            <input
              value={alternate.email}
              onChange={(e) =>
                setAlternate({ ...alternate, email: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => onSave(null)}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/will/step/2")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            disabled={!canContinue || saving}
            onClick={() => onSave(4)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:opacity-60"
          >
            Continue →
          </button>
        </div>
      </div>

      {!canContinue && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
          Add a primary executor to continue.
        </div>
      )}
    </div>
  );
}