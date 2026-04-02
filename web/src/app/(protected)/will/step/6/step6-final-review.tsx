"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DraftStatus = "DRAFT" | "LOCKED";

type Asset = {
  id: string;
  type: string;
  description: string;
  value: number | null;
};

type Beneficiary = {
  id: string;
  fullName: string;
  relationship: string;
  isMinor: boolean;
};

type Executor = {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
};

type Allocation = {
  beneficiaryId: string;
  percentage: number;
};

type Distributions = Record<string, Allocation[]>;

type Witness = {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
};

type DraftOk = {
  ok: true;
  draft: {
    id: string;
    status: DraftStatus;
    step: number;
    data: unknown;
    updatedAt: string;
  };
};

type DraftErr = { error: string; message?: string };

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

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeAssets(data: unknown): Asset[] {
  if (!isObject(data)) return [];
  const a = data.assets;
  if (!Array.isArray(a)) return [];
  const out: Asset[] = [];
  for (const item of a) {
    if (!isObject(item)) continue;
    const id = typeof item.id === "string" ? item.id : "";
    const type = typeof item.type === "string" ? item.type : "Other";
    const description =
      typeof item.description === "string" ? item.description : "";
    const value = typeof item.value === "number" ? item.value : null;
    if (!id || !description) continue;
    out.push({ id, type, description, value });
  }
  return out;
}

function safeBeneficiaries(data: unknown): Beneficiary[] {
  if (!isObject(data)) return [];
  const b = data.beneficiaries;
  if (!Array.isArray(b)) return [];
  const out: Beneficiary[] = [];
  for (const item of b) {
    if (!isObject(item)) continue;
    const id = typeof item.id === "string" ? item.id : "";
    const fullName = typeof item.fullName === "string" ? item.fullName : "";
    const relationship =
      typeof item.relationship === "string" ? item.relationship : "";
    const isMinor = typeof item.isMinor === "boolean" ? item.isMinor : false;
    if (!id || !fullName) continue;
    out.push({ id, fullName, relationship, isMinor });
  }
  return out;
}

function safeExecutors(data: unknown): {
  primary: Executor | null;
  alternate: Executor | null;
} {
  if (!isObject(data)) return { primary: null, alternate: null };
  const ex = data.executors;
  if (!isObject(ex)) return { primary: null, alternate: null };

  const primary = isObject(ex.primary)
    ? {
        fullName:
          typeof ex.primary.fullName === "string" ? ex.primary.fullName : "",
        idNumber:
          typeof ex.primary.idNumber === "string" ? ex.primary.idNumber : "",
        email: typeof ex.primary.email === "string" ? ex.primary.email : "",
        phone: typeof ex.primary.phone === "string" ? ex.primary.phone : "",
      }
    : null;

  const alternate = isObject(ex.alternate)
    ? {
        fullName:
          typeof ex.alternate.fullName === "string"
            ? ex.alternate.fullName
            : "",
        idNumber:
          typeof ex.alternate.idNumber === "string"
            ? ex.alternate.idNumber
            : "",
        email:
          typeof ex.alternate.email === "string" ? ex.alternate.email : "",
        phone:
          typeof ex.alternate.phone === "string" ? ex.alternate.phone : "",
      }
    : null;

  return { primary, alternate };
}

function safeDistributions(data: unknown): Distributions {
  if (!isObject(data)) return {};
  const d = data.distributions;
  if (!isObject(d)) return {};

  const out: Distributions = {};
  for (const [assetId, allocsUnknown] of Object.entries(d)) {
    if (!Array.isArray(allocsUnknown)) continue;
    const allocs: Allocation[] = [];
    for (const a of allocsUnknown) {
      if (!isObject(a)) continue;
      const beneficiaryId =
        typeof a.beneficiaryId === "string" ? a.beneficiaryId : "";
      const percentage =
        typeof a.percentage === "number" ? a.percentage : NaN;
      if (!beneficiaryId) continue;
      if (!Number.isFinite(percentage)) continue;
      allocs.push({ beneficiaryId, percentage });
    }
    out[assetId] = allocs;
  }
  return out;
}

function safeWitnesses(data: unknown): Witness[] {
  if (!isObject(data)) return [];
  const w = data.witnesses;
  if (!Array.isArray(w)) return [];
  const out: Witness[] = [];
  for (const item of w) {
    if (!isObject(item)) continue;
    out.push({
      id: typeof item.id === "string" ? item.id : uid(),
      fullName: typeof item.fullName === "string" ? item.fullName : "",
      idNumber: typeof item.idNumber === "string" ? item.idNumber : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      email: typeof item.email === "string" ? item.email : "",
    });
  }
  return out;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function totalPercent(allocs: Allocation[]) {
  return allocs.reduce(
    (sum, a) => sum + (Number.isFinite(a.percentage) ? a.percentage : 0),
    0
  );
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

export default function Step6FinalReview() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftId, setDraftId] = useState<string>("");
  const [status, setStatus] = useState<DraftStatus>("DRAFT");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [draftData, setDraftData] = useState<unknown>({});

  const [assets, setAssets] = useState<Asset[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [executors, setExecutors] = useState<{
    primary: Executor | null;
    alternate: Executor | null;
  }>({
    primary: null,
    alternate: null,
  });
  const [distributions, setDistributions] = useState<Distributions>({});

  const [witnesses, setWitnesses] = useState<Witness[]>([
    { id: uid(), fullName: "", idNumber: "", phone: "", email: "" },
    { id: uid(), fullName: "", idNumber: "", phone: "", email: "" },
  ]);

  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

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
        const data = d.data;

        const a = safeAssets(data);
        const b = safeBeneficiaries(data);
        const ex = safeExecutors(data);
        const dist = safeDistributions(data);
        const w = safeWitnesses(data);

        const confirmations =
          isObject(data) && isObject(data.confirmations)
            ? data.confirmations
            : null;

        const confirmedFlag =
          confirmations && typeof confirmations.confirmed === "boolean"
            ? confirmations.confirmed
            : false;

        if (!cancelled) {
          setDraftId(d.id);
          setStatus(d.status);
          setUpdatedAt(d.updatedAt);
          setDraftData(data);

          setAssets(a);
          setBeneficiaries(b);
          setExecutors(ex);
          setDistributions(dist);
          setConfirmed(confirmedFlag);

          if (w.length >= 2) {
            setWitnesses([w[0], w[1]]);
          }

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

  const beneficiaryById = useMemo(() => {
    const map = new Map<string, Beneficiary>();
    for (const b of beneficiaries) map.set(b.id, b);
    return map;
  }, [beneficiaries]);

  const distributionsValid = useMemo(() => {
    if (assets.length === 0) return false;

    for (const asset of assets) {
      const allocs = distributions[asset.id] ?? [];
      if (allocs.length === 0) return false;

      const total = round2(totalPercent(allocs));
      if (total !== 100) return false;

      const seen = new Set<string>();
      for (const a of allocs) {
        if (!a.beneficiaryId) return false;
        if (seen.has(a.beneficiaryId)) return false;
        seen.add(a.beneficiaryId);
        if (!Number.isFinite(a.percentage) || a.percentage < 0) return false;
      }
    }

    return true;
  }, [assets, distributions]);

  const witnessesValid = useMemo(() => {
    if (witnesses.length < 2) return false;
    const w1 = witnesses[0];
    const w2 = witnesses[1];

    return (
      w1.fullName.trim().length >= 3 && w2.fullName.trim().length >= 3
    );
  }, [witnesses]);

  const canLock = useMemo(() => {
    if (status === "LOCKED") return false;
    if (!executors.primary || executors.primary.fullName.trim().length < 3)
      return false;
    if (beneficiaries.length < 1) return false;
    if (assets.length < 1) return false;
    if (!distributionsValid) return false;
    if (!witnessesValid) return false;
    if (!confirmed) return false;
    return true;
  }, [
    status,
    executors.primary,
    beneficiaries.length,
    assets.length,
    distributionsValid,
    witnessesValid,
    confirmed,
  ]);

  const completionItems = useMemo(() => {
    return [
      {
        label: "Primary executor added",
        done: Boolean(
          executors.primary && executors.primary.fullName.trim().length >= 3
        ),
      },
      {
        label: "At least 1 beneficiary added",
        done: beneficiaries.length >= 1,
      },
      {
        label: "At least 1 asset added",
        done: assets.length >= 1,
      },
      {
        label: "All distributions total 100%",
        done: distributionsValid,
      },
      {
        label: "2 witness names added",
        done: witnessesValid,
      },
      {
        label: "Final confirmation checked",
        done: confirmed,
      },
    ];
  }, [
    executors.primary,
    beneficiaries.length,
    assets.length,
    distributionsValid,
    witnessesValid,
    confirmed,
  ]);

  const completedCount = completionItems.filter((item) => item.done).length;
  const progressPercent = Math.round(
    (completedCount / completionItems.length) * 100
  );
  const readOnly = status === "LOCKED";

  function setWitnessAt(index: number, next: Witness) {
    setWitnesses((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    setSavedMsg(null);
  }

  async function saveDataOnly() {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    const base = isObject(draftData) ? draftData : {};

    const merged = {
      ...base,
      witnesses: [witnesses[0], witnesses[1]],
      confirmations: {
        confirmed,
        confirmedAt: confirmed ? new Date().toISOString() : null,
      },
    };

    try {
      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: 6,
        }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErr(payload, "Failed to save"));
        setSaving(false);
        return;
      }

      setDraftData(merged);
      setSavedMsg("Saved.");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
    }
  }

  async function lockNow() {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    const base = isObject(draftData) ? draftData : {};

    const merged = {
      ...base,
      witnesses: [witnesses[0], witnesses[1]],
      confirmations: {
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: 6,
          status: "LOCKED",
        }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErr(payload, "Failed to lock"));
        setSaving(false);
        return;
      }

      setDraftData(merged);
      setStatus("LOCKED");
      setSavedMsg("Locked.");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
    }
  }

  async function unlockNow() {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErr(payload, "Failed to unlock"));
        setSaving(false);
        return;
      }

      setStatus("DRAFT");
      setSavedMsg("Unlocked. You can edit again.");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
        Loading your review…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] px-4 py-4 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Final review status
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Draft ID: <span className="font-medium text-slate-700">{draftId}</span>
            {" • "}
            Status:{" "}
            <span
              className={
                status === "LOCKED"
                  ? "font-semibold text-emerald-700"
                  : "font-semibold text-slate-700"
              }
            >
              {status}
            </span>
            {" • "}
            Last updated:{" "}
            <span className="font-medium text-slate-700">{updatedAt}</span>
          </div>
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

      {readOnly ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          This will is locked. Unlock it if you need to edit anything.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-4 text-sm text-slate-700">
          Review everything carefully, add your witnesses, then lock your will when ready.
        </div>
      )}

      <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">
              Completion check
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Complete each requirement before locking your will.
            </div>
          </div>

          <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {completedCount}/{completionItems.length} complete
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/90 ring-1 ring-white/80">
          <div
            className={`h-full rounded-full transition-all ${
              progressPercent === 100 ? "bg-emerald-500" : "bg-[#7b95bb]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className={
                item.done
                  ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                  : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
              }
            >
              <span className="mr-2 font-semibold">
                {item.done ? "✓" : "•"}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-base font-semibold text-slate-900">
            Executors
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Primary
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {executors.primary?.fullName || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {executors.primary?.phone || executors.primary?.email || "No additional details"}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Alternate
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {executors.alternate?.fullName || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {executors.alternate?.phone || executors.alternate?.email || "No additional details"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-base font-semibold text-slate-900">
            Beneficiaries
          </div>

          {beneficiaries.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
              No beneficiaries added yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {beneficiaries.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {b.fullName}
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {b.relationship}
                    </span>
                    {b.isMinor ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        Minor
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-base font-semibold text-slate-900">
          Assets and distributions
        </div>

        {assets.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
            No assets added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {assets.map((a) => {
              const allocs = distributions[a.id] ?? [];
              const total = round2(totalPercent(allocs));
              const totalOk = total === 100;

              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#6d87ad]">
                        {a.type}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {a.description}
                      </div>
                      {a.value !== null ? (
                        <div className="mt-1 text-sm text-slate-600">
                          {formatZAR(a.value)}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={
                        totalOk
                          ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                          : "inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                      }
                    >
                      {total}% allocated
                    </div>
                  </div>

                  {allocs.length === 0 ? (
                    <div className="mt-4 text-sm text-slate-600">
                      No allocations added.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {allocs.map((x, idx) => {
                        const b = beneficiaryById.get(x.beneficiaryId);

                        return (
                          <div
                            key={`${a.id}_${idx}`}
                            className="flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="text-sm text-slate-700">
                              {b ? b.fullName : "Unknown beneficiary"}
                            </div>
                            <div className="inline-flex items-center rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#6d87ad]">
                              {x.percentage}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-base font-semibold text-slate-900">
          Witnesses
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Add two witnesses before locking your will.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {[0, 1].map((idx) => {
            const w = witnesses[idx];

            return (
              <div
                key={w.id}
                className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4"
              >
                <div className="text-sm font-semibold text-slate-900">
                  Witness {idx + 1}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Full Name">
                    <input
                      disabled={readOnly}
                      value={w.fullName}
                      onChange={(e) =>
                        setWitnessAt(idx, { ...w, fullName: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Full Name (required)"
                    />
                  </Field>

                  <Field label="ID / Passport">
                    <input
                      disabled={readOnly}
                      value={w.idNumber}
                      onChange={(e) =>
                        setWitnessAt(idx, { ...w, idNumber: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Optional"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      disabled={readOnly}
                      value={w.phone}
                      onChange={(e) =>
                        setWitnessAt(idx, { ...w, phone: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Optional"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      disabled={readOnly}
                      value={w.email}
                      onChange={(e) =>
                        setWitnessAt(idx, { ...w, email: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="flex items-start gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            I confirm this will reflects my intentions and I understand I can update it later by unlocking and saving changes.
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </button>

          <div className="flex flex-wrap gap-3">
            {status === "LOCKED" ? (
              <button
                type="button"
                disabled={saving}
                onClick={unlockNow}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
              >
                {saving ? "Working..." : "Unlock & Edit"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDataOnly}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Progress"}
                </button>

                <button
                  type="button"
                  disabled={saving || !canLock}
                  onClick={lockNow}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Locking..." : "Lock Will"}
                </button>
              </>
            )}
          </div>
        </div>

        {status !== "LOCKED" && !canLock ? (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700 ring-1 ring-amber-200">
            To lock: add a primary executor, at least 1 beneficiary, at least 1 asset, valid 100% distributions for every asset, 2 witness names, and tick the confirmation box.
          </div>
        ) : null}
      </div>
    </div>
  );
}