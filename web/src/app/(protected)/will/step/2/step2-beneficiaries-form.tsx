"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
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

type BeneficiaryType =
  | "INDIVIDUAL"
  | "CHILD"
  | "SPOUSE_PARTNER"
  | "FAMILY_MEMBER"
  | "FRIEND"
  | "CHARITY"
  | "ORGANISATION"
  | "OTHER";

type Beneficiary = {
  id: string;
  beneficiaryType: BeneficiaryType;
  fullName: string;
  relationship: string;
  idNumber: string;
  email: string;
  phone: string;
  isMinor: boolean;
  shareNotes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  googleMapsLink: string;
};

type GooglePrediction = {
  description: string;
  placePrediction: GooglePlacePredictionLite;
};

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types: string[];
};

type GooglePlaceLite = {
  addressComponents?: GoogleAddressComponent[];
  formattedAddress?: string;
  googleMapsURI?: string;
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

type GooglePlacePredictionLite = {
  text?: {
    toString?: () => string;
    text?: string;
  };
  toPlace: () => GooglePlaceLite;
};

type GoogleAutocompleteSuggestionLite = {
  placePrediction?: GooglePlacePredictionLite;
};

type GoogleAutocompleteResponseLite = {
  suggestions?: GoogleAutocompleteSuggestionLite[];
};

type GoogleAutocompleteSessionTokenLite = object;

type GooglePlacesLibraryLite = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes?: string[];
      sessionToken?: GoogleAutocompleteSessionTokenLite;
      language?: string;
    }) => Promise<GoogleAutocompleteResponseLite>;
  };
  AutocompleteSessionToken?: new () => GoogleAutocompleteSessionTokenLite;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (
          libraryName: "places"
        ) => Promise<GooglePlacesLibraryLite>;
      };
    };
  }
}

const RELATIONSHIP_OPTIONS = [
  "",
  "Spouse",
  "Partner",
  "Son",
  "Daughter",
  "Child",
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Grandchild",
  "Grandparent",
  "Aunt",
  "Uncle",
  "Cousin",
  "Friend",
  "Charity",
  "Organisation",
  "Other",
];

const BENEFICIARY_TYPE_OPTIONS: Array<{
  value: BeneficiaryType;
  label: string;
}> = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "CHILD", label: "Child" },
  { value: "SPOUSE_PARTNER", label: "Spouse / Partner" },
  { value: "FAMILY_MEMBER", label: "Family Member" },
  { value: "FRIEND", label: "Friend" },
  { value: "CHARITY", label: "Charity" },
  { value: "ORGANISATION", label: "Organisation" },
  { value: "OTHER", label: "Other" },
];

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

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function isValidBeneficiaryType(value: unknown): value is BeneficiaryType {
  return (
    value === "INDIVIDUAL" ||
    value === "CHILD" ||
    value === "SPOUSE_PARTNER" ||
    value === "FAMILY_MEMBER" ||
    value === "FRIEND" ||
    value === "CHARITY" ||
    value === "ORGANISATION" ||
    value === "OTHER"
  );
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

function emptyBeneficiary(): Beneficiary {
  return {
    id: uid(),
    beneficiaryType: "INDIVIDUAL",
    fullName: "",
    relationship: "",
    idNumber: "",
    email: "",
    phone: "",
    isMinor: false,
    shareNotes: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    country: "South Africa",
    googleMapsLink: "",
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
      beneficiaryType: isValidBeneficiaryType(item.beneficiaryType)
        ? item.beneficiaryType
        : "INDIVIDUAL",
      fullName: safeString(item.fullName),
      relationship: safeString(item.relationship),
      idNumber: safeString(item.idNumber),
      email: safeString(item.email),
      phone: safeString(item.phone),
      isMinor: safeBoolean(item.isMinor),
      shareNotes: safeString(item.shareNotes),
      addressLine1: safeString(item.addressLine1),
      addressLine2: safeString(item.addressLine2),
      city: safeString(item.city),
      province: safeString(item.province),
      country: safeString(item.country) || "South Africa",
      googleMapsLink: safeString(item.googleMapsLink),
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
      beneficiaryType: b.beneficiaryType,
      fullName: b.fullName,
      relationship: b.relationship,
      idNumber: b.idNumber,
      email: b.email,
      phone: b.phone,
      isMinor: b.isMinor,
      shareNotes: b.shareNotes,
      addressLine1: b.addressLine1,
      addressLine2: b.addressLine2,
      city: b.city,
      province: b.province,
      country: b.country,
      googleMapsLink: b.googleMapsLink,
    })),
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

function getBeneficiaryTypeLabel(value: BeneficiaryType) {
  return (
    BENEFICIARY_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    "Individual"
  );
}

function getAddressComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string
) {
  return components?.find((component) => component.types.includes(type));
}

function componentLongText(
  components: GoogleAddressComponent[] | undefined,
  type: string
) {
  return getAddressComponent(components, type)?.longText ?? "";
}

function mapProvinceName(value: string) {
  const normalized = value.trim().toLowerCase();

  const provinceMap: Record<string, string> = {
    "eastern cape": "Eastern Cape",
    "free state": "Free State",
    gauteng: "Gauteng",
    "kwazulu-natal": "KwaZulu-Natal",
    "kwa-zulu natal": "KwaZulu-Natal",
    "kwazulu natal": "KwaZulu-Natal",
    limpopo: "Limpopo",
    mpumalanga: "Mpumalanga",
    "northern cape": "Northern Cape",
    "north west": "North West",
    "western cape": "Western Cape",
  };

  return provinceMap[normalized] ?? value;
}

function buildStreetAddress(components: GoogleAddressComponent[] | undefined) {
  const streetNumber = componentLongText(components, "street_number");
  const route = componentLongText(components, "route");

  return [streetNumber, route].filter(Boolean).join(" ").trim();
}

function buildAddressLine2(components: GoogleAddressComponent[] | undefined) {
  const candidates = [
    componentLongText(components, "subpremise"),
    componentLongText(components, "premise"),
    componentLongText(components, "neighborhood"),
    componentLongText(components, "sublocality"),
    componentLongText(components, "sublocality_level_1"),
  ].filter((value): value is string => Boolean(value));

  return candidates.join(", ");
}

function buildCity(components: GoogleAddressComponent[] | undefined) {
  return (
    componentLongText(components, "locality") ||
    componentLongText(components, "postal_town") ||
    componentLongText(components, "sublocality_level_1") ||
    componentLongText(components, "administrative_area_level_2") ||
    ""
  );
}

function buildProvince(components: GoogleAddressComponent[] | undefined) {
  const province = componentLongText(components, "administrative_area_level_1");
  return province ? mapProvinceName(province) : "";
}

function buildCountry(components: GoogleAddressComponent[] | undefined) {
  return componentLongText(components, "country") || "South Africa";
}

function predictionTextToString(prediction: GooglePlacePredictionLite) {
  const value = prediction.text;

  if (!value) return "";
  if (typeof value.toString === "function") {
    const result = value.toString();
    if (typeof result === "string" && result.trim()) return result;
  }

  if (typeof value.text === "string") return value.text;

  return "";
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

  const [googleReady, setGoogleReady] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GooglePrediction[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSearching, setAddressSearching] = useState(false);

  const placesLibraryRef = useRef<GooglePlacesLibraryLite | null>(null);
  const sessionTokenRef = useRef<GoogleAutocompleteSessionTokenLite | null>(null);
  const addressDropdownRef = useRef<HTMLDivElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const autocompleteRequestIdRef = useRef(0);

  const canAdd = useMemo(() => {
    return (
      active.fullName.trim().length >= 3 &&
      active.relationship.trim().length >= 2
    );
  }, [active.fullName, active.relationship]);

  const canContinue = useMemo(
    () => beneficiaries.length >= 1,
    [beneficiaries.length]
  );

  const activeHasLocationLink = useMemo(() => {
    return isLikelyGoogleMapsUrl(active.googleMapsLink);
  }, [active.googleMapsLink]);

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

  useEffect(() => {
    let cancelled = false;

    async function initPlacesLibrary() {
      if (!googleReady || !window.google?.maps?.importLibrary) return;

      try {
        const placesLibrary = await window.google.maps.importLibrary("places");

        if (cancelled) return;

        placesLibraryRef.current = placesLibrary;

        if (
          !sessionTokenRef.current &&
          typeof placesLibrary.AutocompleteSessionToken === "function"
        ) {
          sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
        }

        setPlacesReady(true);
      } catch {
        if (!cancelled) {
          setPlacesReady(false);
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }

    initPlacesLibrary();

    return () => {
      cancelled = true;
    };
  }, [googleReady]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        addressDropdownRef.current &&
        !addressDropdownRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!googleReady || !placesReady || !placesLibraryRef.current) return;

    const query = active.addressLine1.trim();

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }

    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setAddressSearching(false);
      return;
    }

    const requestId = ++autocompleteRequestIdRef.current;

    autocompleteTimerRef.current = setTimeout(async () => {
      const placesLibrary = placesLibraryRef.current;
      if (!placesLibrary) return;

      setAddressSearching(true);

      try {
        if (
          !sessionTokenRef.current &&
          typeof placesLibrary.AutocompleteSessionToken === "function"
        ) {
          sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
        }

        const response =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: query,
              includedRegionCodes: ["za"],
              sessionToken: sessionTokenRef.current ?? undefined,
              language: "en",
            }
          );

        if (requestId !== autocompleteRequestIdRef.current) {
          return;
        }

        const mapped: GooglePrediction[] = (response.suggestions ?? [])
          .map((suggestion) => {
            const placePrediction = suggestion.placePrediction;
            if (!placePrediction) return null;

            const description = predictionTextToString(placePrediction).trim();

            if (!description) return null;

            return {
              description,
              placePrediction,
            };
          })
          .filter((item): item is GooglePrediction => Boolean(item));

        setAddressSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } catch (error) {
        console.error("Step 2 autocomplete error:", error);

        if (requestId === autocompleteRequestIdRef.current) {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (requestId === autocompleteRequestIdRef.current) {
          setAddressSearching(false);
        }
      }
    }, 300);

    return () => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }
    };
  }, [active.addressLine1, googleReady, placesReady]);

  function addActive() {
    if (!canAdd) return;

    const next: Beneficiary = {
      ...active,
      fullName: active.fullName.trim(),
      relationship: active.relationship.trim(),
      idNumber: active.idNumber.trim(),
      email: active.email.trim(),
      phone: active.phone.trim(),
      shareNotes: active.shareNotes.trim(),
      addressLine1: active.addressLine1.trim(),
      addressLine2: active.addressLine2.trim(),
      city: active.city.trim(),
      province: active.province.trim(),
      country: active.country.trim(),
      googleMapsLink: active.googleMapsLink.trim(),
    };

    setBeneficiaries((prev) => [...prev, next]);
    setActive(emptyBeneficiary());
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setSavedMsg(null);
    setError(null);

    if (
      placesLibraryRef.current?.AutocompleteSessionToken &&
      typeof placesLibraryRef.current.AutocompleteSessionToken === "function"
    ) {
      sessionTokenRef.current =
        new placesLibraryRef.current.AutocompleteSessionToken();
    }
  }

  function removeById(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSavedMsg(null);
    setError(null);
  }

  async function onSelectAddressSuggestion(prediction: GooglePrediction) {
    setActive((p) => ({
      ...p,
      addressLine1: prediction.description,
    }));

    setShowSuggestions(false);
    setAddressSearching(true);

    try {
      const place = prediction.placePrediction.toPlace();

      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress", "googleMapsURI"],
      });

      const components = place.addressComponents;

      const streetAddress = buildStreetAddress(components);
      const addressLine2 = buildAddressLine2(components);
      const city = buildCity(components);
      const province = buildProvince(components);
      const country = buildCountry(components);
      const googleMapsLink = place.googleMapsURI ?? "";

      setActive((p) => ({
        ...p,
        addressLine1:
          streetAddress || place.formattedAddress || prediction.description,
        addressLine2: addressLine2 || p.addressLine2,
        city: city || p.city,
        province: province || p.province,
        country: country || p.country || "South Africa",
        googleMapsLink: googleMapsLink || p.googleMapsLink,
      }));

      if (
        placesLibraryRef.current?.AutocompleteSessionToken &&
        typeof placesLibraryRef.current.AutocompleteSessionToken === "function"
      ) {
        sessionTokenRef.current =
          new placesLibraryRef.current.AutocompleteSessionToken();
      }
    } catch {
      setActive((p) => ({
        ...p,
        addressLine1: prediction.description,
      }));
    } finally {
      setAddressSearching(false);
      setAddressSuggestions([]);
    }
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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}&libraries=places&v=weekly`}
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />

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
              <div className="text-base font-semibold text-slate-900">
                Add beneficiary
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Add the people, charities, or organisations that may inherit from
                your estate. You can add more than one and keep this list as clear
                as possible.
              </div>
            </div>

            <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Step 2 beneficiaries
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Beneficiary type">
                <select
                  value={active.beneficiaryType}
                  onChange={(e) =>
                    setActive((p) => ({
                      ...p,
                      beneficiaryType: e.target.value as BeneficiaryType,
                    }))
                  }
                  className={inputClassName()}
                >
                  {BENEFICIARY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Relationship">
                <select
                  value={active.relationship}
                  onChange={(e) =>
                    setActive((p) => ({ ...p, relationship: e.target.value }))
                  }
                  className={inputClassName()}
                >
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option || "blank"} value={option}>
                      {option || "Select relationship"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Full name / entity name">
              <input
                value={active.fullName}
                onChange={(e) =>
                  setActive((p) => ({ ...p, fullName: e.target.value }))
                }
                className={inputClassName()}
                placeholder="e.g. Jane Doe or St Luke’s Children’s Fund"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="ID / Passport / Registration (optional)">
                <input
                  value={active.idNumber}
                  onChange={(e) =>
                    setActive((p) => ({ ...p, idNumber: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="Optional but useful for clarity"
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
                  This beneficiary is a minor
                </label>
              </div>
            </div>

            {active.isMinor ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 ring-1 ring-amber-200">
                Minors usually need extra care in later guardian and trustee
                instructions. Keep their details clear and identifiable.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Phone (optional)">
                <input
                  value={active.phone}
                  onChange={(e) =>
                    setActive((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="e.g. +27 82 123 4567"
                />
              </Field>

              <Field label="Email (optional)">
                <input
                  value={active.email}
                  onChange={(e) =>
                    setActive((p) => ({ ...p, email: e.target.value }))
                  }
                  className={inputClassName()}
                  placeholder="e.g. jane@email.com"
                />
              </Field>
            </div>

            <Field
              label="Gift / share notes (optional)"
              hint="Use this if there is anything important to remember about this beneficiary’s share."
            >
              <textarea
                value={active.shareNotes}
                onChange={(e) =>
                  setActive((p) => ({ ...p, shareNotes: e.target.value }))
                }
                rows={3}
                className={inputClassName()}
                placeholder="e.g. Equal share with siblings, specific support intention, or notes for later."
              />
            </Field>

            <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
              <div className="text-sm font-semibold text-slate-900">
                Address / location (optional)
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Helpful when you want the beneficiary to be easily identifiable,
                especially for family members, minors, or property-linked gifts.
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5">
                <Field label="Address line 1">
                  <div className="relative" ref={addressDropdownRef}>
                    <input
                      ref={addressInputRef}
                      value={active.addressLine1}
                      onChange={(e) => {
                        const value = e.target.value;

                        setActive((p) => ({
                          ...p,
                          addressLine1: value,
                        }));
                        setSavedMsg(null);

                        if (value.trim().length < 3) {
                          setAddressSuggestions([]);
                          setShowSuggestions(false);
                          setAddressSearching(false);
                        }
                      }}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className={inputClassName()}
                      placeholder="e.g. 12 Main Road"
                      autoComplete="off"
                    />

                    {googleReady &&
                    placesReady &&
                    showSuggestions &&
                    addressSuggestions.length > 0 ? (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.description}-${predictionTextToString(
                              suggestion.placePrediction
                            )}`}
                            type="button"
                            onClick={() => onSelectAddressSuggestion(suggestion)}
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-slate-50"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {googleReady && placesReady && addressSearching ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Searching address suggestions…
                      </div>
                    ) : null}

                    {(!googleReady || !placesReady) ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Address autocomplete will load when Google Maps is ready.
                      </div>
                    ) : null}
                  </div>
                </Field>

                <Field label="Address line 2">
                  <input
                    value={active.addressLine2}
                    onChange={(e) =>
                      setActive((p) => ({
                        ...p,
                        addressLine2: e.target.value,
                      }))
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
                        setActive((p) => ({ ...p, city: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="e.g. Cape Town"
                    />
                  </Field>

                  <Field label="Province / Region">
                    <select
                      value={active.province}
                      onChange={(e) =>
                        setActive((p) => ({ ...p, province: e.target.value }))
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
                        setActive((p) => ({ ...p, country: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="e.g. South Africa"
                    />
                  </Field>
                </div>

                <Field
                  label="Google Maps / location link"
                  hint="Optional pinned location if you want a more exact address reference"
                >
                  <div className="flex flex-col gap-3 lg:flex-row">
                    <input
                      value={active.googleMapsLink}
                      onChange={(e) =>
                        setActive((p) => ({
                          ...p,
                          googleMapsLink: e.target.value,
                        }))
                      }
                      className={inputClassName()}
                      placeholder="Paste a Google Maps link"
                    />

                    {activeHasLocationLink ? (
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
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addActive}
                disabled={!canAdd}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add beneficiary +
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Current beneficiaries
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Review your current list before moving to the next step.
              </div>
            </div>

            <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {beneficiaries.length} added
            </div>
          </div>

          {beneficiaries.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
              No beneficiaries added yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {beneficiaries.map((b) => {
                const addressPreview = [
                  b.addressLine1,
                  b.addressLine2,
                  b.city,
                  b.province,
                  b.country,
                ]
                  .map((part) => part.trim())
                  .filter(Boolean)
                  .join(", ");

                const hasMap = isLikelyGoogleMapsUrl(b.googleMapsLink);

                return (
                  <div
                    key={b.id}
                    className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-slate-800">
                            {b.fullName}
                          </div>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {getBeneficiaryTypeLabel(b.beneficiaryType)}
                          </span>

                          {b.isMinor ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                              Minor
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 text-sm text-slate-600">
                          {b.relationship}
                          {b.phone ? ` • ${b.phone}` : ""}
                          {b.email ? ` • ${b.email}` : ""}
                        </div>

                        {b.shareNotes ? (
                          <div className="mt-3 rounded-2xl bg-[#f8fafc] px-3 py-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                            {b.shareNotes}
                          </div>
                        ) : null}

                        {addressPreview ? (
                          <div className="mt-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">
                              Address:
                            </span>{" "}
                            {addressPreview}
                          </div>
                        ) : null}

                        {hasMap ? (
                          <div className="mt-2">
                            <a
                              href={b.googleMapsLink}
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
                        onClick={() => removeById(b.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    </div>
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
    </>
  );
}