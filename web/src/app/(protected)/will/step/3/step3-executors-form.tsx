"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Executor = {
  fullName: string;
  relationship: string;
  idType: string;
  idNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  googleMapsLink: string;
};

type ExecutorsData = {
  primary?: Partial<Executor>;
  alternate?: Partial<Executor>;
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
  "Attorney",
  "Accountant",
  "Business Partner",
  "Other",
];

const ID_TYPE_OPTIONS = ["South African ID", "Passport", "Other"];

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

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeExecutor(value: unknown): Partial<Executor> {
  if (!isObject(value)) return {};

  return {
    fullName: safeString(value.fullName),
    relationship: safeString(value.relationship),
    idType: safeString(value.idType),
    idNumber: safeString(value.idNumber),
    email: safeString(value.email),
    phone: safeString(value.phone),
    addressLine1: safeString(value.addressLine1),
    addressLine2: safeString(value.addressLine2),
    city: safeString(value.city),
    province: safeString(value.province),
    country: safeString(value.country),
    googleMapsLink: safeString(value.googleMapsLink),
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

function emptyExecutor(): Executor {
  return {
    fullName: "",
    relationship: "",
    idType: "South African ID",
    idNumber: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    country: "South Africa",
    googleMapsLink: "",
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

function addressPreview(executor: Executor) {
  return [
    executor.addressLine1,
    executor.addressLine2,
    executor.city,
    executor.province,
    executor.country,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
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

function ExecutorCard({
  title,
  subtitle,
  tone,
  executor,
  setExecutor,
  googleReady,
}: {
  title: string;
  subtitle: string;
  tone: "primary" | "alternate";
  executor: Executor;
  setExecutor: React.Dispatch<React.SetStateAction<Executor>>;
  googleReady: boolean;
}) {
  const hasMap = isLikelyGoogleMapsUrl(executor.googleMapsLink);
  const preview = addressPreview(executor);

  const [placesReady, setPlacesReady] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GooglePrediction[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSearching, setAddressSearching] = useState(false);

  const placesLibraryRef = useRef<GooglePlacesLibraryLite | null>(null);
  const sessionTokenRef = useRef<GoogleAutocompleteSessionTokenLite | null>(null);
  const addressDropdownRef = useRef<HTMLDivElement | null>(null);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRequestIdRef = useRef(0);

  const cardClass =
    tone === "primary"
      ? "rounded-[24px] border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5"
      : "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm";

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

    const query = executor.addressLine1.trim();

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

        if (requestId !== autocompleteRequestIdRef.current) return;

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
        console.error(`${title} autocomplete error:`, error);

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
  }, [executor.addressLine1, googleReady, placesReady, title]);

  async function onSelectAddressSuggestion(prediction: GooglePrediction) {
    setExecutor((prev) => ({
      ...prev,
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

      setExecutor((prev) => ({
        ...prev,
        addressLine1:
          streetAddress || place.formattedAddress || prediction.description,
        addressLine2: addressLine2 || prev.addressLine2,
        city: city || prev.city,
        province: province || prev.province,
        country: country || prev.country || "South Africa",
        googleMapsLink: googleMapsLink || prev.googleMapsLink,
      }));

      if (
        placesLibraryRef.current?.AutocompleteSessionToken &&
        typeof placesLibraryRef.current.AutocompleteSessionToken === "function"
      ) {
        sessionTokenRef.current =
          new placesLibraryRef.current.AutocompleteSessionToken();
      }
    } catch {
      setExecutor((prev) => ({
        ...prev,
        addressLine1: prediction.description,
      }));
    } finally {
      setAddressSearching(false);
      setAddressSuggestions([]);
    }
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</div>
        </div>

        <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {tone === "primary" ? "Required" : "Optional"}
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <Field label="Full name">
          <input
            value={executor.fullName}
            onChange={(e) =>
              setExecutor((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className={inputClassName()}
            placeholder="e.g. John Smith"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Relationship">
            <select
              value={executor.relationship}
              onChange={(e) =>
                setExecutor((prev) => ({
                  ...prev,
                  relationship: e.target.value,
                }))
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

          <Field label="ID type">
            <select
              value={executor.idType}
              onChange={(e) =>
                setExecutor((prev) => ({
                  ...prev,
                  idType: e.target.value,
                }))
              }
              className={inputClassName()}
            >
              {ID_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ID / Passport">
            <input
              value={executor.idNumber}
              onChange={(e) =>
                setExecutor((prev) => ({
                  ...prev,
                  idNumber: e.target.value,
                }))
              }
              className={inputClassName()}
              placeholder={
                executor.idType === "Passport"
                  ? "e.g. A12345678"
                  : "e.g. 8001015009087"
              }
            />
          </Field>

          <Field label="Phone">
            <input
              value={executor.phone}
              onChange={(e) =>
                setExecutor((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className={inputClassName()}
              placeholder="e.g. +27 82 123 4567"
            />
          </Field>
        </div>

        <Field label="Email">
          <input
            value={executor.email}
            onChange={(e) =>
              setExecutor((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className={inputClassName()}
            placeholder="e.g. john@email.com"
          />
        </Field>

        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
          <div className="text-sm font-semibold text-slate-900">
            Address / location
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            Helpful if you want your executor to be clearly identifiable and easy
            to locate.
          </div>

          <div className="mt-4 grid gap-5">
            <Field label="Address line 1">
              <div className="relative" ref={addressDropdownRef}>
                <input
                  value={executor.addressLine1}
                  onChange={(e) =>
                    setExecutor((prev) => ({
                      ...prev,
                      addressLine1: e.target.value,
                    }))
                  }
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

                {(!googleReady || !placesReady) && (
                  <div className="mt-2 text-xs text-slate-500">
                    Address autocomplete will load when Google Maps is ready.
                  </div>
                )}
              </div>
            </Field>

            <Field label="Address line 2">
              <input
                value={executor.addressLine2}
                onChange={(e) =>
                  setExecutor((prev) => ({
                    ...prev,
                    addressLine2: e.target.value,
                  }))
                }
                className={inputClassName()}
                placeholder="e.g. Plumstead"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City / Town">
                <input
                  value={executor.city}
                  onChange={(e) =>
                    setExecutor((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="e.g. Cape Town"
                />
              </Field>

              <Field label="Province / Region">
                <select
                  value={executor.province}
                  onChange={(e) =>
                    setExecutor((prev) => ({
                      ...prev,
                      province: e.target.value,
                    }))
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
                  value={executor.country}
                  onChange={(e) =>
                    setExecutor((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="e.g. South Africa"
                />
              </Field>
            </div>

            <Field
              label="Google Maps / location link"
              hint="Optional pinned location for a more exact address reference"
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  value={executor.googleMapsLink}
                  onChange={(e) =>
                    setExecutor((prev) => ({
                      ...prev,
                      googleMapsLink: e.target.value,
                    }))
                  }
                  className={inputClassName()}
                  placeholder="Paste a Google Maps link"
                />

                {hasMap ? (
                  <a
                    href={executor.googleMapsLink}
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

            {(preview || hasMap) && (
              <div className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Address preview
                </div>

                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {preview || "No address entered yet."}
                </div>

                {hasMap ? (
                  <div className="mt-3">
                    <a
                      href={executor.googleMapsLink}
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
    </div>
  );
}

export default function Step3ExecutorsForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftData, setDraftData] = useState<unknown>({});
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [primary, setPrimary] = useState<Executor>(emptyExecutor());
  const [alternate, setAlternate] = useState<Executor>(emptyExecutor());

  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  const canContinue = useMemo(() => {
    return (
      primary.fullName.trim().length >= 3 &&
      primary.relationship.trim().length >= 2
    );
  }, [primary.fullName, primary.relationship]);

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
            relationship: ex.primary.relationship ?? "",
            idType: ex.primary.idType || "South African ID",
            idNumber: ex.primary.idNumber ?? "",
            email: ex.primary.email ?? "",
            phone: ex.primary.phone ?? "",
            addressLine1: ex.primary.addressLine1 ?? "",
            addressLine2: ex.primary.addressLine2 ?? "",
            city: ex.primary.city ?? "",
            province: ex.primary.province ?? "",
            country: ex.primary.country || "South Africa",
            googleMapsLink: ex.primary.googleMapsLink ?? "",
          });
        }

        if (ex.alternate) {
          setAlternate({
            fullName: ex.alternate.fullName ?? "",
            relationship: ex.alternate.relationship ?? "",
            idType: ex.alternate.idType || "South African ID",
            idNumber: ex.alternate.idNumber ?? "",
            email: ex.alternate.email ?? "",
            phone: ex.alternate.phone ?? "",
            addressLine1: ex.alternate.addressLine1 ?? "",
            addressLine2: ex.alternate.addressLine2 ?? "",
            city: ex.alternate.city ?? "",
            province: ex.alternate.province ?? "",
            country: ex.alternate.country || "South Africa",
            googleMapsLink: ex.alternate.googleMapsLink ?? "",
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
    setSavedMsg(null);

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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}&libraries=places&v=weekly`}
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />

      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {savedMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {savedMsg}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Executors and backup planning
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Your executor is the person responsible for carrying out your will.
                Choose someone trustworthy, organised, and likely to be reachable
                when needed.
              </div>
            </div>

            <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Step 3
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
            <div className="text-sm font-semibold text-slate-900">
              Good executor qualities
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Reliable, calm under pressure, reachable, and able to handle legal
              and family responsibilities responsibly.
            </div>
          </div>
        </div>

        <ExecutorCard
          title="Primary Executor"
          subtitle="This person will have first responsibility for carrying out your will."
          tone="primary"
          executor={primary}
          setExecutor={setPrimary}
          googleReady={googleReady}
        />

        <ExecutorCard
          title="Alternate Executor"
          subtitle="A backup choice in case your primary executor is unavailable, unwilling, or unable to act."
          tone="alternate"
          executor={alternate}
          setExecutor={setAlternate}
          googleReady={googleReady}
        />

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

        {!canContinue ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
            Add a primary executor name and relationship to continue.
          </div>
        ) : null}
      </div>
    </>
  );
}