"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type ReviewStat = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
};

type StepLinkItem = {
  step: number;
  title: string;
  description: string;
  href: string;
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

function formatDateTime(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
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

function SectionShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-white via-[#fafcff] to-[#f9f6f2] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function StepEditCard({
  item,
  disabled,
}: {
  item: StepLinkItem;
  disabled: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group rounded-[24px] border px-4 py-4 transition ${
        disabled
          ? "cursor-pointer border-slate-200 bg-slate-50/90 hover:border-slate-300 hover:bg-white"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#7b95bb]/40 hover:shadow-[0_16px_35px_rgba(123,149,187,0.14)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4fb] text-sm font-semibold text-[#6d87ad]">
          {item.step}
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Edit
        </div>
      </div>

      <div className="mt-4 text-sm font-semibold text-slate-900">
        {item.title}
      </div>
      <div className="mt-1 text-sm leading-6 text-slate-600">
        {item.description}
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6d87ad]">
        Go to Step {item.step}
        <span className="transition group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}

function StatCard({ label, value, tone = "default" }: ReviewStat) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50/70 text-amber-800"
      : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight">{value}</div>
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

  const totalAssetsValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0);
  }, [assets]);

  const assetValidation = useMemo(() => {
    return assets.map((asset) => {
      const allocs = distributions[asset.id] ?? [];
      const total = round2(totalPercent(allocs));
      const duplicateBeneficiaries = new Set<string>();
      let hasDuplicate = false;

      for (const alloc of allocs) {
        if (duplicateBeneficiaries.has(alloc.beneficiaryId)) {
          hasDuplicate = true;
          break;
        }
        duplicateBeneficiaries.add(alloc.beneficiaryId);
      }

      return {
        asset,
        allocs,
        total,
        totalOk: total === 100,
        hasAllocations: allocs.length > 0,
        hasDuplicate,
      };
    });
  }, [assets, distributions]);

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

    return w1.fullName.trim().length >= 3 && w2.fullName.trim().length >= 3;
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

  const missingItems = completionItems
    .filter((item) => !item.done)
    .map((item) => item.label);

  const incompleteAssetMessages = assetValidation
    .filter((entry) => !entry.hasAllocations || !entry.totalOk || entry.hasDuplicate)
    .map((entry) => {
      if (!entry.hasAllocations) {
        return `${entry.asset.description} has no beneficiary allocations.`;
      }
      if (entry.hasDuplicate) {
        return `${entry.asset.description} has duplicate beneficiary allocations.`;
      }
      if (!entry.totalOk) {
        return `${entry.asset.description} totals ${entry.total}% instead of 100%.`;
      }
      return "";
    })
    .filter(Boolean);

  const stepLinks: StepLinkItem[] = [
    {
      step: 1,
      title: "Your Details",
      description: "Review personal details and your will profile setup.",
      href: "/will/step/1",
    },
    {
      step: 2,
      title: "Beneficiaries",
      description: "Review everyone included in your will.",
      href: "/will/step/2",
    },
    {
      step: 3,
      title: "Executors",
      description: "Confirm who will administer your estate.",
      href: "/will/step/3",
    },
    {
      step: 4,
      title: "Assets",
      description: "Check assets, descriptions, and recorded values.",
      href: "/will/step/4",
    },
    {
      step: 5,
      title: "Distributions",
      description: "Verify who receives what and how each asset is split.",
      href: "/will/step/5",
    },
  ];

  const heroStats: ReviewStat[] = [
    {
      label: "Completion",
      value: `${progressPercent}%`,
      tone: progressPercent === 100 ? "success" : "default",
    },
    {
      label: "Beneficiaries",
      value: `${beneficiaries.length}`,
      tone: beneficiaries.length > 0 ? "default" : "warning",
    },
    {
      label: "Assets",
      value: `${assets.length}`,
      tone: assets.length > 0 ? "default" : "warning",
    },
    {
      label: "Estimated Estate Value",
      value: totalAssetsValue > 0 ? formatZAR(totalAssetsValue) : "Not captured",
      tone: totalAssetsValue > 0 ? "default" : "warning",
    },
  ];

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
      <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 text-sm text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
        Loading your final review...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(238,244,251,0.95),rgba(255,255,255,1)_42%,rgba(249,246,242,0.9))] shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d87ad] shadow-sm">
                Step 6 • Final Review
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Review, validate, and finalise your will
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                This page brings together every prior step so the user can do a
                clean premium review before locking the will. All core logic is
                preserved, including draft loading, witness capture, save
                progress, and lock or unlock actions.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
                  Draft ID: <span className="font-semibold text-slate-800">{draftId}</span>
                </div>
                <div
                  className={`rounded-full border px-3 py-1.5 ${
                    status === "LOCKED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white/90 text-slate-700"
                  }`}
                >
                  Status: <span className="font-semibold">{status}</span>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
                  Updated:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Finalisation readiness
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {completedCount}/{completionItems.length} requirements complete
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      canLock
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {canLock ? "Ready to lock" : "Action still required"}
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressPercent === 100 ? "bg-emerald-500" : "bg-[#7b95bb]"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {heroStats.map((item) => (
                    <StatCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {savedMsg ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          {savedMsg}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {readOnly ? (
        <div className="rounded-[26px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 text-sm leading-7 text-emerald-800 shadow-sm">
          Your will is currently locked. The review remains visible for reference.
          Unlock it only if you need to make changes before saving again.
        </div>
      ) : null}

      {!readOnly && !canLock ? (
        <div className="rounded-[26px] border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-4 text-sm leading-7 text-amber-800 shadow-sm">
          Your will cannot be locked yet. Finish the remaining requirements below,
          review the prior steps if needed, then return here to submit.
        </div>
      ) : null}

      <SectionShell
        title="Edit prior steps"
        subtitle="Jump back into any earlier step without losing the review page structure."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stepLinks.map((item) => (
            <StepEditCard key={item.step} item={item} disabled={readOnly} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Validation centre"
        subtitle="A clean final checklist with clear warnings before lock."
        action={
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {completedCount}/{completionItems.length} complete
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-[22px] border px-4 py-4 text-sm ${
                item.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50/70 text-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    item.done
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  {item.done ? "✓" : "!"}
                </div>
                <div className="leading-6">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {!canLock ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="text-sm font-semibold text-amber-900">
                Outstanding lock requirements
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                {missingItems.map((item) => (
                  <div key={item} className="flex gap-2">
                    <span className="font-semibold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">
                Plan / support action
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                If your premium flow includes plan or payment gating, keep the
                CTA visible here so the user can resolve access before
                finalisation.
              </div>
              <div className="mt-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Plans / Upgrade
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {incompleteAssetMessages.length > 0 ? (
          <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4">
            <div className="text-sm font-semibold text-rose-900">
              Distribution warnings
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-rose-800">
              {incompleteAssetMessages.map((message) => (
                <div key={message} className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span>{message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionShell>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionShell
          title="Executors summary"
          subtitle="Confirm who is responsible for administering the estate."
          action={
            <Link
              href="/will/step/3"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Step 3
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Primary executor
              </div>
              <div className="mt-3 text-base font-semibold text-slate-900">
                {executors.primary?.fullName || "Not added yet"}
              </div>
              <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                <div>ID: {executors.primary?.idNumber || "—"}</div>
                <div>Email: {executors.primary?.email || "—"}</div>
                <div>Phone: {executors.primary?.phone || "—"}</div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Alternate executor
              </div>
              <div className="mt-3 text-base font-semibold text-slate-900">
                {executors.alternate?.fullName || "Not added yet"}
              </div>
              <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                <div>ID: {executors.alternate?.idNumber || "—"}</div>
                <div>Email: {executors.alternate?.email || "—"}</div>
                <div>Phone: {executors.alternate?.phone || "—"}</div>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          title="Beneficiaries summary"
          subtitle="Review every beneficiary captured earlier."
          action={
            <Link
              href="/will/step/2"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Step 2
            </Link>
          }
        >
          {beneficiaries.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
              No beneficiaries added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries.map((b) => (
                <div
                  key={b.id}
                  className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {b.fullName}
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {b.relationship || "Relationship not specified"}
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
        </SectionShell>
      </div>

      <SectionShell
        title="Assets and distributions"
        subtitle="This section shows every asset and the beneficiary split applied in Step 5."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/will/step/4"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Step 4
            </Link>
            <Link
              href="/will/step/5"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Step 5
            </Link>
          </div>
        }
      >
        {assets.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
            No assets added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {assetValidation.map((entry) => (
              <div
                key={entry.asset.id}
                className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#fbfcfe]"
              >
                <div className="border-b border-slate-200 bg-white/70 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl">
                      <div className="inline-flex items-center rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#6d87ad]">
                        {entry.asset.type}
                      </div>
                      <div className="mt-3 text-base font-semibold text-slate-900">
                        {entry.asset.description}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {entry.asset.value !== null
                          ? formatZAR(entry.asset.value)
                          : "No asset value entered"}
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        entry.totalOk
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {entry.total}% allocated
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-5">
                  {!entry.hasAllocations ? (
                    <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No allocations added for this asset yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entry.allocs.map((alloc, idx) => {
                        const beneficiary = beneficiaryById.get(alloc.beneficiaryId);

                        return (
                          <div
                            key={`${entry.asset.id}_${idx}`}
                            className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {beneficiary ? beneficiary.fullName : "Unknown beneficiary"}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {beneficiary?.relationship || "Relationship not specified"}
                              </div>
                            </div>

                            <div className="inline-flex items-center rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#6d87ad]">
                              {alloc.percentage}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {entry.hasDuplicate ? (
                    <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      Duplicate beneficiary allocations detected for this asset.
                    </div>
                  ) : null}

                  {!entry.totalOk && entry.hasAllocations ? (
                    <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This asset must total exactly 100% before final lock.
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell
        title="Witness details"
        subtitle="Two witness names are required before final lock. Additional details remain optional."
      >
        <div className="grid grid-cols-1 gap-4">
          {[0, 1].map((idx) => {
            const w = witnesses[idx];

            return (
              <div
                key={w.id}
                className="rounded-[26px] border border-slate-200 bg-[#fbfcfe] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-base font-semibold text-slate-900">
                    Witness {idx + 1}
                  </div>
                  <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      w.fullName.trim().length >= 3
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {w.fullName.trim().length >= 3
                      ? "Name added"
                      : "Full name required"}
                  </div>
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
      </SectionShell>

      <SectionShell
        title="Final confirmation and submission"
        subtitle="Save progress at any time, then lock once every requirement is complete."
      >
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[26px] border border-slate-200 bg-[#fbfcfe] p-4 sm:p-5">
            <label className="flex items-start gap-3 text-sm leading-7 text-slate-800">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setSavedMsg(null);
                }}
                className="mt-1 h-4 w-4"
              />
              <span>
                I confirm this will reflects my intentions and I understand I can
                update it later by unlocking and saving changes.
              </span>
            </label>

            {!readOnly && !confirmed ? (
              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tick the confirmation box to enable final locking once all other
                checks pass.
              </div>
            ) : null}

            {readOnly ? (
              <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                This will is already locked and can be viewed as a completed final review.
              </div>
            ) : null}
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="text-sm font-semibold text-slate-900">
              Final action panel
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Use save for draft progress. Use the main CTA only when the will is
              fully validated and ready to be locked.
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </button>

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
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(123,149,187,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(123,149,187,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Locking..." : "Final Submit & Lock Will"}
                  </button>
                </>
              )}

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Payment / Plan Options
              </Link>
            </div>
          </div>
        </div>

        {status !== "LOCKED" && !canLock ? (
          <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
            To lock this will, add a primary executor, at least 1 beneficiary,
            at least 1 asset, valid 100% distributions for every asset, 2 witness
            names, and tick the final confirmation box.
          </div>
        ) : null}
      </SectionShell>
    </div>
  );
}