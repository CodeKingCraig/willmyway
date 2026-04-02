"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Asset = {
  id: string;
  type: string;
  description: string;
  value: number | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptyAsset(): Asset {
  return {
    id: uid(),
    type: "Property",
    description: "",
    value: null,
  };
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
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

const ASSET_TYPES = [
  "Property",
  "Bank Account",
  "Vehicle",
  "Investment",
  "Business Interest",
  "Other",
] as const;

export default function Step4AssetsForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftData, setDraftData] = useState<unknown>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [active, setActive] = useState<Asset>(emptyAsset());

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const canAdd = useMemo(() => {
    return active.description.trim().length >= 3;
  }, [active.description]);

  const canContinue = useMemo(() => {
    return assets.length >= 1;
  }, [assets.length]);

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

        if (isObject(data) && Array.isArray(data.assets)) {
          const safeAssets: Asset[] = data.assets
            .filter((item): item is Record<string, unknown> => isObject(item))
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : uid(),
              type: typeof item.type === "string" ? item.type : "Property",
              description:
                typeof item.description === "string" ? item.description : "",
              value:
                typeof item.value === "number"
                  ? item.value
                  : item.value === null
                    ? null
                    : null,
            }));

          setAssets(safeAssets);
        }

        setLoading(false);
      } catch {
        setError("Network error.");
        setLoading(false);
      }
    }

    load();
  }, []);

  function addAsset() {
    if (!canAdd) return;

    setAssets((prev) => [
      ...prev,
      {
        ...active,
        description: active.description.trim(),
      },
    ]);

    setActive(emptyAsset());
    setSavedMsg(null);
    setError(null);
  }

  function removeAsset(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSavedMsg(null);
    setError(null);
  }

  async function onSave(nextStep: number | null) {
    setSaving(true);
    setError(null);
    setSavedMsg(null);

    try {
      const merged = {
        ...(isObject(draftData) ? draftData : {}),
        assets,
      };

      const res = await fetch("/api/will/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: merged,
          step: nextStep ?? 4,
        }),
      });

      if (!res.ok) {
        setError("Failed to save.");
        setSaving(false);
        return;
      }

      setDraftData(merged);
      setSavedMsg("Saved successfully.");
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
      <div className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] px-4 py-4 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Add the major items that form part of your estate.
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
        <div className="text-base font-semibold text-slate-900">Add Asset</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          Start with your most important assets. Clear descriptions make it easier to assign them later.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {ASSET_TYPES.map((type) => {
            const isActive = active.type === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setActive((prev) => ({ ...prev, type }))}
                className={
                  isActive
                    ? "inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)]"
                    : "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                }
              >
                {type}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5">
          <Field label="Asset Description">
            <input
              placeholder="e.g. House in Cape Town, Toyota Hilux, FNB savings account"
              value={active.description}
              onChange={(e) =>
                setActive({ ...active, description: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <Field label="Estimated Value (optional)">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1500000"
              value={active.value ?? ""}
              onChange={(e) =>
                setActive({
                  ...active,
                  value: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canAdd}
              onClick={addAsset}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Asset +
            </button>

            {!canAdd ? (
              <div className="text-xs text-slate-500">
                Add a clear description to continue.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <div className="text-base font-semibold text-slate-900">Assets Added</div>

        {assets.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
            No assets added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {assets.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-slate-800">{a.type}</div>
                    <span className="rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#6d87ad]">
                      Estate Asset
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {a.description}
                  </div>

                  {a.value !== null ? (
                    <div className="mt-1 text-sm text-slate-500">
                      Estimated Value: {formatZAR(a.value)}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeAsset(a.id)}
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
            onClick={() => router.push("/will/step/3")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            type="button"
            disabled={!canContinue || saving}
            onClick={() => onSave(5)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue to Step 5 →
          </button>
        </div>
      </div>

      {!canContinue ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700 ring-1 ring-amber-200">
          Add at least 1 asset to continue.
        </div>
      ) : null}
    </div>
  );
}