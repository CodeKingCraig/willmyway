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

type PersonalDetails = {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
};

function emptyDetails(): PersonalDetails {
  return {
    fullName: "",
    idNumber: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
  };
}

function readPersonalDetailsFromDraftData(data: unknown): PersonalDetails {
  if (!isObject(data)) return emptyDetails();

  const pd = data.personalDetails;
  if (!isObject(pd)) return emptyDetails();

  return {
    fullName: typeof pd.fullName === "string" ? pd.fullName : "",
    idNumber: typeof pd.idNumber === "string" ? pd.idNumber : "",
    dateOfBirth: typeof pd.dateOfBirth === "string" ? pd.dateOfBirth : "",
    addressLine1: typeof pd.addressLine1 === "string" ? pd.addressLine1 : "",
    addressLine2: typeof pd.addressLine2 === "string" ? pd.addressLine2 : "",
    city: typeof pd.city === "string" ? pd.city : "",
    province: typeof pd.province === "string" ? pd.province : "",
    postalCode: typeof pd.postalCode === "string" ? pd.postalCode : "",
  };
}

function mergePersonalDetailsIntoDraftData(
  existing: unknown,
  pd: PersonalDetails
): Record<string, unknown> {
  const base = isObject(existing) ? existing : {};

  return {
    ...base,
    personalDetails: {
      fullName: pd.fullName,
      idNumber: pd.idNumber,
      dateOfBirth: pd.dateOfBirth,
      addressLine1: pd.addressLine1,
      addressLine2: pd.addressLine2,
      city: pd.city,
      province: pd.province,
      postalCode: pd.postalCode,
    },
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

export default function Step1Form() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<unknown>({});
  const [details, setDetails] = useState<PersonalDetails>(emptyDetails());

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    return details.fullName.trim().length > 2 && details.idNumber.trim().length > 5;
  }, [details.fullName, details.idNumber]);

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
        const pd = readPersonalDetailsFromDraftData(d.data);

        if (!cancelled) {
          setDraftId(d.id);
          setDraftData(d.data);
          setDetails(pd);
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

  async function onSave(nextStep: number | null) {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    try {
      const merged = mergePersonalDetailsIntoDraftData(draftData, details);

      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: nextStep ?? 1,
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

      <div className="grid grid-cols-1 gap-5">
        <Field label="Full Name">
          <input
            value={details.fullName}
            onChange={(e) => setDetails((p) => ({ ...p, fullName: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            placeholder="e.g. Craig Hess"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="ID Number / Passport">
            <input
              value={details.idNumber}
              onChange={(e) => setDetails((p) => ({ ...p, idNumber: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
              placeholder="e.g. 8001015009087"
            />
          </Field>

          <Field label="Date of Birth">
            <input
              value={details.dateOfBirth}
              onChange={(e) => setDetails((p) => ({ ...p, dateOfBirth: e.target.value }))}
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>
        </div>

        <Field label="Address Line 1">
          <input
            value={details.addressLine1}
            onChange={(e) => setDetails((p) => ({ ...p, addressLine1: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            placeholder="Street address"
          />
        </Field>

        <Field label="Address Line 2">
          <input
            value={details.addressLine2}
            onChange={(e) => setDetails((p) => ({ ...p, addressLine2: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            placeholder="Complex / Unit / Suburb"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="City">
            <input
              value={details.city}
              onChange={(e) => setDetails((p) => ({ ...p, city: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <Field label="Province">
            <input
              value={details.province}
              onChange={(e) => setDetails((p) => ({ ...p, province: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <Field label="Postal Code">
            <input
              value={details.postalCode}
              onChange={(e) => setDetails((p) => ({ ...p, postalCode: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>
        </div>
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

        <button
          type="button"
          onClick={() => onSave(2)}
          disabled={saving || !canContinue}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue to Step 2 →
        </button>
      </div>

      {!canContinue ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700 ring-1 ring-amber-200">
          Enter at least your full name and ID/passport number to continue.
        </div>
      ) : null}
    </div>
  );
}