"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AssetType =
  | "Property"
  | "Bank Account"
  | "Vehicle"
  | "Investment"
  | "Business Interest"
  | "Other";

type Asset = {
  id: string;
  type: AssetType;
  description: string;
  value: number | null;
  referenceName: string;
  institutionOrIssuer: string;
  registrationNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  googleMapsLink: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isValidAssetType(value: unknown): value is AssetType {
  return (
    value === "Property" ||
    value === "Bank Account" ||
    value === "Vehicle" ||
    value === "Investment" ||
    value === "Business Interest" ||
    value === "Other"
  );
}

function emptyAsset(): Asset {
  return {
    id: uid(),
    type: "Property",
    description: "",
    value: null,
    referenceName: "",
    institutionOrIssuer: "",
    registrationNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    country: "South Africa",
    googleMapsLink: "",
  };
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyGoogleMapsUrl(value: string) {
  if (!value.trim()) return false;
  if (!isValidHttpUrl(value)) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      host.includes("google.com") ||
      host.includes("maps.app.goo.gl") ||
      host.includes("goo.gl")
    );
  } catch {
    return false;
  }
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeAsset(value: unknown): Asset | null {
  if (!isObject(value)) return null;

  return {
    id: typeof value.id === "string" ? value.id : uid(),
    type: isValidAssetType(value.type) ? value.type : "Property",
    description: safeString(value.description),
    value:
      typeof value.value === "number"
        ? value.value
        : value.value === null
          ? null
          : null,
    referenceName: safeString(value.referenceName),
    institutionOrIssuer: safeString(value.institutionOrIssuer),
    registrationNumber: safeString(value.registrationNumber),
    addressLine1: safeString(value.addressLine1),
    addressLine2: safeString(value.addressLine2),
    city: safeString(value.city),
    province: safeString(value.province),
    country: safeString(value.country) || "South Africa",
    googleMapsLink: safeString(value.googleMapsLink),
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15";
}

const ASSET_TYPES: readonly AssetType[] = [
  "Property",
  "Bank Account",
  "Vehicle",
  "Investment",
  "Business Interest",
  "Other",
] as const;

const PROVINCE_OPTIONS = [
  "",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

function getTypeTone(type: AssetType) {
  switch (type) {
    case "Property":
      return "bg-[#eef4fb] text-[#6d87ad]";
    case "Bank Account":
      return "bg-[#f4fbf7] text-emerald-700";
    case "Vehicle":
      return "bg-[#fff7ed] text-orange-700";
    case "Investment":
      return "bg-[#f5f3ff] text-violet-700";
    case "Business Interest":
      return "bg-[#fdf2f8] text-pink-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function addressPreview(asset: Asset) {
  return [
    asset.addressLine1,
    asset.addressLine2,
    asset.city,
    asset.province,
    asset.country,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

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

  const activeHasMap = useMemo(() => {
    return isLikelyGoogleMapsUrl(active.googleMapsLink);
  }, [active.googleMapsLink]);

  const activeAddressPreview = useMemo(() => {
    return addressPreview(active);
  }, [active]);

  const showAddressSection = active.type === "Property";
  const showInstitutionField =
    active.type === "Bank Account" ||
    active.type === "Investment" ||
    active.type === "Business Interest";
  const showRegistrationField =
    active.type === "Vehicle" ||
    active.type === "Business Interest" ||
    active.type === "Investment";

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
          const safeAssets = data.assets
            .map((item) => safeAsset(item))
            .filter((item): item is Asset => item !== null);

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
        referenceName: active.referenceName.trim(),
        institutionOrIssuer: active.institutionOrIssuer.trim(),
        registrationNumber: active.registrationNumber.trim(),
        addressLine1: active.addressLine1.trim(),
        addressLine2: active.addressLine2.trim(),
        city: active.city.trim(),
        province: active.province.trim(),
        country: active.country.trim(),
        googleMapsLink: active.googleMapsLink.trim(),
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

      <div className="rounded-[24px] border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">Add Asset</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Start with your most important assets. Clear descriptions and
              reference details make it easier to allocate them later.
            </div>
          </div>

          <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            Step 4 assets
          </div>
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
              className={inputClassName()}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Reference name / label (optional)"
              hint="A simple label that helps you identify the asset later"
            >
              <input
                placeholder="e.g. Family home, Hilux bakkie, Discovery investment"
                value={active.referenceName}
                onChange={(e) =>
                  setActive({ ...active, referenceName: e.target.value })
                }
                className={inputClassName()}
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
                className={inputClassName()}
              />
            </Field>
          </div>

          {showInstitutionField ? (
            <Field
              label="Institution / issuer / company (optional)"
              hint="Useful for banks, investments, and business interests"
            >
              <input
                placeholder="e.g. FNB, Allan Gray, ABC Trading (Pty) Ltd"
                value={active.institutionOrIssuer}
                onChange={(e) =>
                  setActive({
                    ...active,
                    institutionOrIssuer: e.target.value,
                  })
                }
                className={inputClassName()}
              />
            </Field>
          ) : null}

          {showRegistrationField ? (
            <Field
              label="Registration / account / policy reference (optional)"
              hint="Vehicle registration, account reference, policy number, or company registration"
            >
              <input
                placeholder="e.g. CA123456, Account ending 4432, 2020/123456/07"
                value={active.registrationNumber}
                onChange={(e) =>
                  setActive({
                    ...active,
                    registrationNumber: e.target.value,
                  })
                }
                className={inputClassName()}
              />
            </Field>
          ) : null}

          {showAddressSection ? (
            <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
              <div className="text-sm font-semibold text-slate-900">
                Property location
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                For property assets, add the address and optional Google Maps
                pin to make the asset easier to identify.
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5">
                <Field label="Address line 1">
                  <input
                    value={active.addressLine1}
                    onChange={(e) =>
                      setActive({
                        ...active,
                        addressLine1: e.target.value,
                      })
                    }
                    className={inputClassName()}
                    placeholder="e.g. 29A Popham Street"
                  />
                </Field>

                <Field label="Address line 2">
                  <input
                    value={active.addressLine2}
                    onChange={(e) =>
                      setActive({
                        ...active,
                        addressLine2: e.target.value,
                      })
                    }
                    className={inputClassName()}
                    placeholder="e.g. Plumstead"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Field label="City / Town">
                    <input
                      value={active.city}
                      onChange={(e) =>
                        setActive({
                          ...active,
                          city: e.target.value,
                        })
                      }
                      className={inputClassName()}
                      placeholder="e.g. Cape Town"
                    />
                  </Field>

                  <Field label="Province / Region">
                    <select
                      value={active.province}
                      onChange={(e) =>
                        setActive({
                          ...active,
                          province: e.target.value,
                        })
                      }
                      className={inputClassName()}
                    >
                      {PROVINCE_OPTIONS.map((option) => (
                        <option key={option || "blank"} value={option}>
                          {option || "Select province"}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Country">
                    <input
                      value={active.country}
                      onChange={(e) =>
                        setActive({
                          ...active,
                          country: e.target.value,
                        })
                      }
                      className={inputClassName()}
                      placeholder="e.g. South Africa"
                    />
                  </Field>
                </div>

                <Field
                  label="Google Maps / location link"
                  hint="Optional pinned location for exact property reference"
                >
                  <div className="flex flex-col gap-3 lg:flex-row">
                    <input
                      value={active.googleMapsLink}
                      onChange={(e) =>
                        setActive({
                          ...active,
                          googleMapsLink: e.target.value,
                        })
                      }
                      className={inputClassName()}
                      placeholder="Paste a Google Maps link"
                    />

                    {activeHasMap ? (
                      <a
                        href={active.googleMapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View location
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400"
                      >
                        View location
                      </button>
                    )}
                  </div>
                </Field>

                {(activeAddressPreview || activeHasMap) && (
                  <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Property preview
                    </div>

                    <div className="mt-2 text-sm leading-6 text-slate-700">
                      {activeAddressPreview || "No property address entered yet."}
                    </div>

                    {activeHasMap ? (
                      <div className="mt-3">
                        <a
                          href={active.googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#6d87ad] underline underline-offset-4"
                        >
                          Open saved map location
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-base font-semibold text-slate-900">
            Assets Added
          </div>

          <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {assets.length} asset{assets.length === 1 ? "" : "s"} added
          </div>
        </div>

        {assets.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
            No assets added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {assets.map((a) => {
              const preview = addressPreview(a);
              const hasMap = isLikelyGoogleMapsUrl(a.googleMapsLink);

              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-800">{a.type}</div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTypeTone(
                          a.type
                        )}`}
                      >
                        Estate Asset
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-700">
                      {a.description}
                    </div>

                    {a.referenceName ? (
                      <div className="mt-1 text-sm text-slate-500">
                        Reference: {a.referenceName}
                      </div>
                    ) : null}

                    {a.institutionOrIssuer ? (
                      <div className="mt-1 text-sm text-slate-500">
                        Institution / issuer: {a.institutionOrIssuer}
                      </div>
                    ) : null}

                    {a.registrationNumber ? (
                      <div className="mt-1 text-sm text-slate-500">
                        Reference number: {a.registrationNumber}
                      </div>
                    ) : null}

                    {a.value !== null ? (
                      <div className="mt-1 text-sm text-slate-500">
                        Estimated Value: {formatZAR(a.value)}
                      </div>
                    ) : null}

                    {preview ? (
                      <div className="mt-2 text-sm text-slate-500">
                        Location: {preview}
                      </div>
                    ) : null}

                    {hasMap ? (
                      <div className="mt-2">
                        <a
                          href={a.googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#6d87ad] underline underline-offset-4"
                        >
                          Open saved location
                        </a>
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
              );
            })}
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