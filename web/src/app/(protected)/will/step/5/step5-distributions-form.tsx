"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  idNumber: string;
  email: string;
  phone: string;
  isMinor: boolean;
};

type Allocation = {
  beneficiaryId: string;
  percentage: number;
};

type Distributions = Record<string, Allocation[]>;

type DraftOk = {
  ok: true;
  draft: {
    id: string;
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

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
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
    const idNumber = typeof item.idNumber === "string" ? item.idNumber : "";
    const email = typeof item.email === "string" ? item.email : "";
    const phone = typeof item.phone === "string" ? item.phone : "";
    const isMinor = typeof item.isMinor === "boolean" ? item.isMinor : false;
    if (!id || !fullName) continue;
    out.push({
      id,
      fullName,
      relationship,
      idNumber,
      email,
      phone,
      isMinor,
    });
  }
  return out;
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

function totalPercent(allocs: Allocation[]) {
  return allocs.reduce(
    (sum, a) => sum + (Number.isFinite(a.percentage) ? a.percentage : 0),
    0
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function hasDuplicateBeneficiaries(allocs: Allocation[]) {
  const seen = new Set<string>();
  for (const a of allocs) {
    if (!a.beneficiaryId) continue;
    if (seen.has(a.beneficiaryId)) return true;
    seen.add(a.beneficiaryId);
  }
  return false;
}

function allocationStatusForAsset(assetId: string, distributions: Distributions) {
  const allocs = distributions[assetId] ?? [];
  const total = round2(totalPercent(allocs));
  const duplicates = hasDuplicateBeneficiaries(allocs);

  if (allocs.length === 0) {
    return {
      tone: "pending" as const,
      label: "Not started",
      helper: "Add at least one allocation row.",
      total,
      duplicates,
    };
  }

  if (duplicates) {
    return {
      tone: "error" as const,
      label: "Duplicate beneficiary",
      helper: "Each person should appear only once per asset.",
      total,
      duplicates,
    };
  }

  if (total !== 100) {
    return {
      tone: "warning" as const,
      label: `${total}% allocated`,
      helper: "This asset must total exactly 100%.",
      total,
      duplicates,
    };
  }

  return {
    tone: "success" as const,
    label: "Ready",
    helper: "This asset is fully allocated.",
    total,
    duplicates,
  };
}

function toneClasses(
  tone: "pending" | "warning" | "error" | "success"
) {
  if (tone === "success") {
    return {
      badge:
        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      bar: "bg-emerald-500",
      panel:
        "border-emerald-200 bg-emerald-50/60",
      helper: "text-emerald-700",
    };
  }

  if (tone === "error") {
    return {
      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      bar: "bg-rose-500",
      panel: "border-rose-200 bg-rose-50/60",
      helper: "text-rose-700",
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      bar: "bg-amber-500",
      panel: "border-amber-200 bg-amber-50/60",
      helper: "text-amber-700",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    bar: "bg-slate-300",
    panel: "border-slate-200 bg-slate-50/60",
    helper: "text-slate-600",
  };
}

function initialSplit(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((100 / count) * 100) / 100;
  const values = Array.from({ length: count }, () => base);
  const used = round2(values.reduce((sum, value) => sum + value, 0));
  const remainder = round2(100 - used);
  values[values.length - 1] = round2(values[values.length - 1] + remainder);
  return values;
}

export default function Step5DistributionsForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftData, setDraftData] = useState<unknown>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [distributions, setDistributions] = useState<Distributions>({});

  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
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

        const data = payload.draft.data;

        const a = safeAssets(data);
        const b = safeBeneficiaries(data);
        const dist = safeDistributions(data);

        if (!cancelled) {
          setDraftData(data);
          setAssets(a);
          setBeneficiaries(b);
          setDistributions(dist);
          setSelectedAssetId(a[0]?.id ?? "");
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

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) ?? null,
    [assets, selectedAssetId]
  );

  const selectedAllocs = useMemo(
    () => distributions[selectedAssetId] ?? [],
    [distributions, selectedAssetId]
  );

  const selectedTotal = useMemo(
    () => round2(totalPercent(selectedAllocs)),
    [selectedAllocs]
  );

  const validation = useMemo(() => {
    if (assets.length === 0) {
      return { ok: false as const, reason: "NO_ASSETS" as const };
    }
    if (beneficiaries.length === 0) {
      return { ok: false as const, reason: "NO_BENEFICIARIES" as const };
    }

    for (const asset of assets) {
      const allocs = distributions[asset.id] ?? [];

      if (allocs.length === 0) {
        return {
          ok: false as const,
          reason: "MISSING_ALLOCATIONS" as const,
          assetId: asset.id,
        };
      }

      if (hasDuplicateBeneficiaries(allocs)) {
        return {
          ok: false as const,
          reason: "DUPLICATES" as const,
          assetId: asset.id,
        };
      }

      const total = round2(totalPercent(allocs));
      if (total !== 100) {
        return {
          ok: false as const,
          reason: "TOTAL_NOT_100" as const,
          assetId: asset.id,
        };
      }

      for (const a of allocs) {
        if (!a.beneficiaryId) {
          return {
            ok: false as const,
            reason: "MISSING_BENEFICIARY" as const,
            assetId: asset.id,
          };
        }
        if (!Number.isFinite(a.percentage) || a.percentage < 0) {
          return {
            ok: false as const,
            reason: "INVALID_PERCENT" as const,
            assetId: asset.id,
          };
        }
      }
    }

    return { ok: true as const };
  }, [assets, beneficiaries, distributions]);

  const canContinue = validation.ok;

  const selectedStatus = useMemo(() => {
    if (!selectedAssetId) {
      return {
        tone: "pending" as const,
        label: "Not started",
        helper: "Choose an asset to begin.",
        total: 0,
        duplicates: false,
      };
    }
    return allocationStatusForAsset(selectedAssetId, distributions);
  }, [distributions, selectedAssetId]);

  function setAllocAt(index: number, next: Allocation) {
    setDistributions((prev) => {
      const nextMap: Distributions = { ...prev };
      const arr = [...(nextMap[selectedAssetId] ?? [])];
      arr[index] = next;
      nextMap[selectedAssetId] = arr;
      return nextMap;
    });
    setSavedMsg(null);
  }

  function addAllocationRow() {
    if (!selectedAssetId) return;

    const firstBeneficiary = beneficiaries[0]?.id ?? "";
    if (!firstBeneficiary) return;

    setDistributions((prev) => {
      const nextMap: Distributions = { ...prev };
      const arr = [...(nextMap[selectedAssetId] ?? [])];
      arr.push({ beneficiaryId: firstBeneficiary, percentage: 0 });
      nextMap[selectedAssetId] = arr;
      return nextMap;
    });

    setSavedMsg(null);
  }

  function removeAllocationRow(index: number) {
    setDistributions((prev) => {
      const nextMap: Distributions = { ...prev };
      const arr = [...(nextMap[selectedAssetId] ?? [])];
      arr.splice(index, 1);
      nextMap[selectedAssetId] = arr;
      return nextMap;
    });
    setSavedMsg(null);
  }

  function applyEqualSplit() {
    if (!selectedAssetId || beneficiaries.length === 0) return;

    const split = initialSplit(beneficiaries.length);

    setDistributions((prev) => ({
      ...prev,
      [selectedAssetId]: beneficiaries.map((b, index) => ({
        beneficiaryId: b.id,
        percentage: split[index] ?? 0,
      })),
    }));

    setSavedMsg(null);
    setError(null);
  }

  function beneficiaryMeta(id: string) {
    return beneficiaries.find((b) => b.id === id) ?? null;
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
        Loading your draft…
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          You don’t have any assets yet. Add at least 1 asset in Step 4 before creating distributions.
        </div>

        <button
          type="button"
          onClick={() => router.push("/will/step/4")}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
        >
          Go to Step 4 →
        </button>
      </div>
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          You don’t have any beneficiaries yet. Add at least 1 beneficiary in Step 2 before assigning assets.
        </div>

        <button
          type="button"
          onClick={() => router.push("/will/step/2")}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
        >
          Go to Step 2 →
        </button>
      </div>
    );
  }

  const duplicateWarning = hasDuplicateBeneficiaries(selectedAllocs);
  const totalOk = selectedTotal === 100;
  const selectedTone = toneClasses(selectedStatus.tone);
  const progressWidth = `${Math.max(0, Math.min(selectedTotal, 100))}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] px-4 py-4 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Allocate your assets
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Select one asset, assign percentages, and make sure the total reaches exactly 100%.
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

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">
            Estate assets
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            Choose an asset to allocate.
          </div>

          <div className="mt-4 space-y-3">
            {assets.map((asset) => {
              const isSelected = asset.id === selectedAssetId;
              const status = allocationStatusForAsset(asset.id, distributions);
              const tone = toneClasses(status.tone);
              const width = `${Math.max(0, Math.min(status.total, 100))}%`;

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={
                    isSelected
                      ? "w-full rounded-2xl border border-[#cfdcf0] bg-[#f8fbff] p-4 text-left ring-2 ring-[#7b95bb]/20 transition"
                      : "w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#6d87ad]">
                        {asset.type}
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                        {asset.description}
                      </div>
                      {asset.value !== null ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {formatZAR(asset.value)}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}
                    >
                      {status.label}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${tone.bar}`}
                        style={{ width }}
                      />
                    </div>
                    <div className={`mt-2 text-[11px] ${tone.helper}`}>
                      {status.helper}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${selectedTone.panel}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Selected asset
                </div>

                {selectedAsset ? (
                  <>
                    <div className="mt-2 inline-flex items-center rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#6d87ad]">
                      {selectedAsset.type}
                    </div>

                    <div className="mt-3 text-lg font-semibold text-slate-900">
                      {selectedAsset.description}
                    </div>

                    {selectedAsset.value !== null ? (
                      <div className="mt-1 text-sm text-slate-600">
                        Estimated value: {formatZAR(selectedAsset.value)}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyEqualSplit}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Split equally
                </button>

                <button
                  type="button"
                  onClick={addAllocationRow}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  Add allocation +
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  Allocation progress
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedTone.badge}`}
                >
                  {selectedTotal}%
                </div>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-white/80">
                <div
                  className={`h-full rounded-full transition-all ${selectedTone.bar}`}
                  style={{ width: progressWidth }}
                />
              </div>

              <div className={`mt-3 text-sm ${selectedTone.helper}`}>
                {selectedStatus.helper}
              </div>

              {!totalOk ? (
                <div className="mt-2 text-xs text-amber-700">
                  This asset must total exactly 100% before you can continue.
                </div>
              ) : null}

              {duplicateWarning ? (
                <div className="mt-2 text-xs text-rose-700">
                  Remove duplicate beneficiary rows for this asset.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            {selectedAllocs.length === 0 ? (
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
                No allocations for this asset yet. Start by adding a row, or use <span className="font-semibold">Split equally</span>.
              </div>
            ) : null}

            {selectedAllocs.map((row, idx) => {
              const meta = beneficiaryMeta(row.beneficiaryId);
              const isDuplicate =
                selectedAllocs.filter(
                  (item) => item.beneficiaryId === row.beneficiaryId
                ).length > 1;
              const invalidPercent =
                !Number.isFinite(row.percentage) || row.percentage < 0;

              return (
                <div
                  key={`${selectedAssetId}_${idx}`}
                  className={
                    isDuplicate || invalidPercent
                      ? "grid grid-cols-1 gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:grid-cols-12 sm:items-end"
                      : "grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-12 sm:items-end"
                  }
                >
                  <div className="sm:col-span-7">
                    <label className="text-sm font-semibold text-slate-700">
                      Beneficiary
                    </label>
                    <select
                      value={row.beneficiaryId}
                      onChange={(e) =>
                        setAllocAt(idx, {
                          ...row,
                          beneficiaryId: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                    >
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.fullName} ({b.relationship})
                          {b.isMinor ? " • Minor" : ""}
                        </option>
                      ))}
                    </select>

                    {meta ? (
                      <div className="mt-2 text-xs text-slate-500">
                        {meta.relationship}
                        {meta.isMinor ? " • Minor" : ""}
                        {meta.email ? ` • ${meta.email}` : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={Number.isFinite(row.percentage) ? row.percentage : 0}
                      onChange={(e) =>
                        setAllocAt(idx, {
                          ...row,
                          percentage:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => removeAllocationRow(idx)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>

                  {isDuplicate ? (
                    <div className="sm:col-span-12 text-xs text-rose-700">
                      This beneficiary is selected more than once for the same asset.
                    </div>
                  ) : null}

                  {invalidPercent ? (
                    <div className="sm:col-span-12 text-xs text-rose-700">
                      Enter a valid percentage of 0 or more.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">
              Quick guidance
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Give one person 100% if they should receive the whole asset.</li>
              <li>• Use equal split if you want a balanced starting point.</li>
              <li>• Every asset must be fully allocated before review.</li>
            </ul>
          </div>
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

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/will/step/4")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => onSave(6)}
            disabled={saving || !canContinue}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue to Review →
          </button>
        </div>
      </div>

      {!canContinue ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700 ring-1 ring-amber-200">
          To continue, every asset must have allocations totaling exactly 100%, with no duplicate beneficiaries per asset.
        </div>
      ) : null}

      {!validation.ok ? (
        <div className="text-[11px] text-slate-400">
          Validation: {validation.reason}
          {"assetId" in validation && typeof validation.assetId === "string"
            ? ` • Asset: ${validation.assetId}`
            : ""}
        </div>
      ) : null}
    </div>
  );

  async function onSave(nextStep: number | null) {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    try {
      const base = isObject(draftData) ? draftData : {};

      const merged = {
        ...base,
        distributions,
      };

      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: nextStep ?? 5,
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

      if (nextStep !== null) {
        router.push(`/will/step/${nextStep}`);
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
    }
  }
}