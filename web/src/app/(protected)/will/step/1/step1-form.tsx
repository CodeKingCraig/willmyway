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

const TITLE_OPTIONS = ["", "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Other"];
const ID_TYPE_OPTIONS = ["South African ID", "Passport", "Other"];
const COUNTRY_OPTIONS = ["South Africa", "Other"];
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

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
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

type PersonalDetails = {
  title: string;
  fullName: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  googleMapsLink: string;
};

function emptyDetails(): PersonalDetails {
  return {
    title: "",
    fullName: "",
    idType: "South African ID",
    idNumber: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "South Africa",
    googleMapsLink: "",
  };
}

function readPersonalDetailsFromDraftData(data: unknown): PersonalDetails {
  if (!isObject(data)) return emptyDetails();

  const pd = data.personalDetails;
  if (!isObject(pd)) return emptyDetails();

  return {
    title: safeString(pd.title),
    fullName: safeString(pd.fullName),
    idType: safeString(pd.idType) || "South African ID",
    idNumber: safeString(pd.idNumber),
    dateOfBirth: safeString(pd.dateOfBirth),
    addressLine1: safeString(pd.addressLine1),
    addressLine2: safeString(pd.addressLine2),
    city: safeString(pd.city),
    province: safeString(pd.province),
    postalCode: safeString(pd.postalCode),
    country: safeString(pd.country) || "South Africa",
    googleMapsLink: safeString(pd.googleMapsLink),
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
      title: pd.title,
      fullName: pd.fullName,
      idType: pd.idType,
      idNumber: pd.idNumber,
      dateOfBirth: pd.dateOfBirth,
      addressLine1: pd.addressLine1,
      addressLine2: pd.addressLine2,
      city: pd.city,
      province: pd.province,
      postalCode: pd.postalCode,
      country: pd.country,
      googleMapsLink: pd.googleMapsLink,
    },
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

function InputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15";
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
    return (
      details.fullName.trim().length > 2 &&
      details.idNumber.trim().length > 5
    );
  }, [details.fullName, details.idNumber]);

  const hasLocationLink = useMemo(() => {
    return isLikelyGoogleMapsUrl(details.googleMapsLink);
  }, [details.googleMapsLink]);

  const fullAddressPreview = useMemo(() => {
    return [
      details.addressLine1,
      details.addressLine2,
      details.city,
      details.province,
      details.postalCode,
      details.country,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }, [
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.province,
    details.postalCode,
    details.country,
  ]);

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
          Draft ID:{" "}
          <span className="font-medium text-slate-700">{draftId ?? "—"}</span>
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
            <div className="text-sm font-semibold text-slate-900">
              Personal identity and location
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Add the details that make your will clearly identifiable and easier
              to verify.
            </div>
          </div>

          <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            Step 1 foundation
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Title">
            <select
              value={details.title}
              onChange={(e) =>
                setDetails((p) => ({ ...p, title: e.target.value }))
              }
              className={InputClassName()}
            >
              {TITLE_OPTIONS.map((option) => (
                <option key={option || "blank"} value={option}>
                  {option || "Select title"}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Full legal name">
              <input
                value={details.fullName}
                onChange={(e) =>
                  setDetails((p) => ({ ...p, fullName: e.target.value }))
                }
                className={InputClassName()}
                placeholder="e.g. Craig Hess"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="ID type">
            <select
              value={details.idType}
              onChange={(e) =>
                setDetails((p) => ({ ...p, idType: e.target.value }))
              }
              className={InputClassName()}
            >
              {ID_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ID number / passport">
            <input
              value={details.idNumber}
              onChange={(e) =>
                setDetails((p) => ({ ...p, idNumber: e.target.value }))
              }
              className={InputClassName()}
              placeholder={
                details.idType === "Passport"
                  ? "e.g. A12345678"
                  : "e.g. 8001015009087"
              }
            />
          </Field>

          <Field label="Date of birth">
            <input
              value={details.dateOfBirth}
              onChange={(e) =>
                setDetails((p) => ({ ...p, dateOfBirth: e.target.value }))
              }
              type="date"
              className={InputClassName()}
            />
          </Field>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Main residential address
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            A complete address helps identify you more clearly in the final
            document.
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5">
            <Field
              label="Street address"
              hint="House number, street name, estate, or building"
            >
              <input
                value={details.addressLine1}
                onChange={(e) =>
                  setDetails((p) => ({ ...p, addressLine1: e.target.value }))
                }
                className={InputClassName()}
                placeholder="e.g. 29A Popham Street"
              />
            </Field>

            <Field
              label="Address line 2"
              hint="Apartment, unit, complex, suburb, or area"
            >
              <input
                value={details.addressLine2}
                onChange={(e) =>
                  setDetails((p) => ({ ...p, addressLine2: e.target.value }))
                }
                className={InputClassName()}
                placeholder="e.g. Unit 4, Oak Gardens, Plumstead"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="City / Town">
                <input
                  value={details.city}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, city: e.target.value }))
                  }
                  className={InputClassName()}
                  placeholder="e.g. Cape Town"
                />
              </Field>

              <Field label="Province / Region">
                <select
                  value={details.province}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, province: e.target.value }))
                  }
                  className={InputClassName()}
                >
                  {PROVINCE_OPTIONS.map((option) => (
                    <option key={option || "blank"} value={option}>
                      {option || "Select province"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Postal code">
                <input
                  value={details.postalCode}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, postalCode: e.target.value }))
                  }
                  className={InputClassName()}
                  placeholder="e.g. 7800"
                />
              </Field>

              <Field label="Country">
                <select
                  value={details.country}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, country: e.target.value }))
                  }
                  className={InputClassName()}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Google Maps / location link"
              hint="Optional but helpful for a pinned property or exact location"
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  value={details.googleMapsLink}
                  onChange={(e) =>
                    setDetails((p) => ({
                      ...p,
                      googleMapsLink: e.target.value,
                    }))
                  }
                  className={InputClassName()}
                  placeholder="Paste a Google Maps link"
                />

                {hasLocationLink ? (
                  <a
                    href={details.googleMapsLink}
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

            {(fullAddressPreview || hasLocationLink) && (
              <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Address preview
                </div>

                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {fullAddressPreview || "No address entered yet."}
                </div>

                {hasLocationLink ? (
                  <div className="mt-3">
                    <a
                      href={details.googleMapsLink}
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
          Enter at least your full legal name and ID/passport number to continue.
        </div>
      ) : null}
    </div>
  );
}