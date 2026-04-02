"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DraftOk = {
  ok: true;
  draft: {
    id: string;
    status: string;
    step: number;
    data: unknown;
  };
};

type DraftErr = {
  error: string;
  message?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isDraftOk(payload: unknown): payload is DraftOk {
  if (!isObject(payload)) return false;
  if (payload.ok !== true) return false;
  if (!isObject(payload.draft)) return false;
  return typeof payload.draft.id === "string";
}

function getErr(payload: unknown, fallback: string) {
  if (!isObject(payload)) return fallback;
  const p = payload as Partial<DraftErr>;
  if (typeof p.error === "string") return p.error;
  if (typeof p.message === "string") return p.message;
  return fallback;
}

type Beneficiary = {
  id: string;
  fullName: string;
  relationship: string;
  idNumber: string;
  email: string;
  phone: string;
  isMinor: boolean;
};

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptyBeneficiary(): Beneficiary {
  return {
    id: uid(),
    fullName: "",
    relationship: "",
    idNumber: "",
    email: "",
    phone: "",
    isMinor: false,
  };
}

function readBeneficiariesFromDraftData(data: unknown): Beneficiary[] {
  if (!isObject(data)) return [];

  const b = data.beneficiaries;
  if (!Array.isArray(b)) return [];

  const out: Beneficiary[] = [];

  for (const item of b) {
    if (!isObject(item)) continue;

    out.push({
      id: typeof item.id === "string" ? item.id : uid(),
      fullName: typeof item.fullName === "string" ? item.fullName : "",
      relationship: typeof item.relationship === "string" ? item.relationship : "",
      idNumber: typeof item.idNumber === "string" ? item.idNumber : "",
      email: typeof item.email === "string" ? item.email : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      isMinor: typeof item.isMinor === "boolean" ? item.isMinor : false,
    });
  }

  return out;
}

function mergeBeneficiariesIntoDraftData(
  existing: unknown,
  beneficiaries: Beneficiary[]
) {
  const base = isObject(existing) ? existing : {};
  return {
    ...base,
    beneficiaries: beneficiaries.map((b) => ({
      id: b.id,
      fullName: b.fullName,
      relationship: b.relationship,
      idNumber: b.idNumber,
      email: b.email,
      phone: b.phone,
      isMinor: b.isMinor,
    })),
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

export default function Step2BeneficiariesForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<unknown>({});
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [active, setActive] = useState<Beneficiary>(emptyBeneficiary());

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const canAdd = useMemo(() => {
    return active.fullName.trim().length >= 3 && active.relationship.trim().length >= 2;
  }, [active.fullName, active.relationship]);

  const canContinue = useMemo(() => beneficiaries.length >= 1, [beneficiaries.length]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setSavedMsg(null);
      setLoading(true);

      try {
        const res = await fetch("/api/will/draft", { method: "GET" });
        const payload: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          if (!cancelled) setError(getErr(payload, "Failed to load draft"));
          if (!cancelled) setLoading(false);
          return;
        }

        if (!isDraftOk(payload)) {
          if (!cancelled) setError("Unexpected response from server");
          if (!cancelled) setLoading(false);
          return;
        }

        const d = payload.draft;
        const existing = readBeneficiariesFromDraftData(d.data);

        if (!cancelled) {
          setDraftId(d.id);
          setDraftData(d.data);
          setBeneficiaries(existing);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setError("Network error. Try again.");
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function addActive() {
    if (!canAdd) return;

    const next: Beneficiary = {
      ...active,
      fullName: active.fullName.trim(),
      relationship: active.relationship.trim(),
      idNumber: active.idNumber.trim(),
      email: active.email.trim(),
      phone: active.phone.trim(),
    };

    setBeneficiaries((prev) => [...prev, next]);
    setActive(emptyBeneficiary());
    setSavedMsg(null);
    setError(null);
  }

  function removeById(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSavedMsg(null);
    setError(null);
  }

  async function onSave(nextStep: number | null) {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    try {
      const merged = mergeBeneficiariesIntoDraftData(draftData, beneficiaries);

      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: nextStep ?? 2,
        }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErr(payload, "Failed to save"));
        setSaving(false);
        return;
      }

      setDraftData(merged);
      setSavedMsg("Saved successfully.");
      setSaving(false);

      if (nextStep !== null) {
        router.push(`/will/step/${nextStep}`);
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
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
      <div className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] px-4 py-4 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Draft ID: <span className="font-medium text-slate-700">{draftId ?? "—"}</span>
        </div>

        {savedMsg ? (
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {savedMsg}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
        <div className="text-base font-semibold text-slate-900">Add Beneficiary</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          Add anyone who may inherit from your estate. You can add more than one.
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5">
          <Field label="Full Name">
            <input
              value={active.fullName}
              onChange={(e) => setActive((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              placeholder="e.g. Jane Doe"
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Relationship">
              <input
                value={active.relationship}
                onChange={(e) =>
                  setActive((p) => ({ ...p, relationship: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                placeholder="e.g. Spouse, Child, Parent"
              />
            </Field>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={active.isMinor}
                  onChange={(e) =>
                    setActive((p) => ({ ...p, isMinor: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                Minor
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="ID / Passport (optional)">
              <input
                value={active.idNumber}
                onChange={(e) => setActive((p) => ({ ...p, idNumber: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>

            <Field label="Phone (optional)">
              <input
                value={active.phone}
                onChange={(e) => setActive((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              />
            </Field>
          </div>

          <Field label="Email (optional)">
            <input
              value={active.email}
              onChange={(e) => setActive((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addActive}
              disabled={!canAdd}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Beneficiary +
            </button>

            {!canAdd ? (
              <div className="text-xs text-slate-500">
                Full name and relationship are required.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <div className="text-base font-semibold text-slate-900">
          Current Beneficiaries
        </div>

        {beneficiaries.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
            No beneficiaries added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {beneficiaries.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {b.fullName}{" "}
                    {b.isMinor ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Minor
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {b.relationship}
                    {b.phone ? ` • ${b.phone}` : ""}
                    {b.email ? ` • ${b.email}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeById(b.id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onSave(null)}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/will/step/1")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => onSave(3)}
            disabled={saving || !canContinue}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue to Step 3 →
          </button>
        </div>
      </div>

      {!canContinue ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700 ring-1 ring-amber-200">
          Add at least 1 beneficiary to continue.
        </div>
      ) : null}
    </div>
  );
}