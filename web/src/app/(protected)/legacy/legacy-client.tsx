"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LegacyLetter = {
  id: string;
  recipientName: string;
  relationship?: string;
  subject: string;
  body: string;
  updatedAt: string;
};

type LegacyFuneral = {
  song?: string;
  flowers?: string;
  tombstoneText?: string;
  serviceNotes?: string;
  donations?: string;
  dressCode?: string;
  locationPreference?: string;
  additionalNotes?: string;
  updatedAt?: string;
};

type LegacyVideoItem = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string;
  addedAt: string;
};

type LegacyData = {
  letters: LegacyLetter[];
  funeral: LegacyFuneral;
};

type DraftOk = {
  ok: true;
  draft: {
    id: string;
    step: number;
    status: "DRAFT" | "LOCKED";
    data: unknown;
    updatedAt: string;
  };
};

type DraftErr = {
  error: string;
  message?: string;
};

const MAX_VIDEO_COUNT = 5;
const MAX_VIDEO_SIZE_MB = 500;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ESTIMATED_VIDEO_MINUTES = "±10";

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
  if (typeof p.message === "string" && p.message.trim()) return p.message;
  if (typeof p.error === "string" && p.error.trim()) return p.error;
  return fallback;
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function safeLegacy(data: unknown): LegacyData {
  if (!isObject(data)) return { letters: [], funeral: {} };
  const legacy = data.legacy;
  if (!isObject(legacy)) return { letters: [], funeral: {} };

  const lettersUnknown = legacy.letters;
  const funeralUnknown = legacy.funeral;

  const letters: LegacyLetter[] = [];
  if (Array.isArray(lettersUnknown)) {
    for (const item of lettersUnknown) {
      if (!isObject(item)) continue;
      const id = safeString(item.id) ?? "";
      const recipientName = safeString(item.recipientName) ?? "";
      const subject = safeString(item.subject) ?? "";
      const body = safeString(item.body) ?? "";
      const updatedAt = safeString(item.updatedAt) ?? new Date().toISOString();
      const relationship = safeString(item.relationship);

      if (!id || !recipientName || !subject) continue;

      letters.push({
        id,
        recipientName,
        relationship,
        subject,
        body,
        updatedAt,
      });
    }
  }

  const funeral: LegacyFuneral = {};
  if (isObject(funeralUnknown)) {
    const pick = (k: keyof LegacyFuneral) => {
      const v = funeralUnknown[k as string];
      const s = safeString(v);
      if (s) (funeral as Record<string, unknown>)[k as string] = s;
    };

    pick("song");
    pick("flowers");
    pick("tombstoneText");
    pick("serviceNotes");
    pick("donations");
    pick("dressCode");
    pick("locationPreference");
    pick("additionalNotes");

    const updatedAt = safeString(
      (funeralUnknown as Record<string, unknown>).updatedAt
    );
    if (updatedAt) funeral.updatedAt = updatedAt;
  }

  return { letters, funeral };
}

function uid(prefix = "l") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatShort(dIso?: string) {
  if (!dIso) return "—";
  const d = new Date(dIso);
  if (!Number.isFinite(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(
    1
  )} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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

function SectionCard({
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
    <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</div>
          ) : null}
        </div>
        {action}
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function SoftPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

export default function LegacyClient() {
  const [loading, setLoading] = useState(true);
  const [savingLetters, setSavingLetters] = useState(false);
  const [savingFuneral, setSavingFuneral] = useState(false);

  const [draftData, setDraftData] = useState<unknown>({});
  const [status, setStatus] = useState<"DRAFT" | "LOCKED">("DRAFT");

  const [legacy, setLegacy] = useState<LegacyData>({ letters: [], funeral: {} });
  const [selectedLetterId, setSelectedLetterId] = useState<string>("");

  const [videoItems, setVideoItems] = useState<LegacyVideoItem[]>([]);
  const [videoMsg, setVideoMsg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setMsg(null);
      setLoading(true);

      try {
        const res = await fetch("/api/will/draft", { method: "GET" });
        const payload: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          if (!cancelled) setError(getErr(payload, "Failed to load draft."));
          if (!cancelled) setLoading(false);
          return;
        }

        if (!isDraftOk(payload)) {
          if (!cancelled) setError("Unexpected response from server.");
          if (!cancelled) setLoading(false);
          return;
        }

        const data = payload.draft.data;
        const s = payload.draft.status;

        const nextLegacy = safeLegacy(data);
        const firstId = nextLegacy.letters[0]?.id ?? "";

        if (!cancelled) {
          setDraftData(data);
          setStatus(s);
          setLegacy(nextLegacy);
          setSelectedLetterId(firstId);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setError("Network error.");
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const item of videoItems) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [videoItems]);

  const isLocked = status === "LOCKED";

  const selectedLetter = useMemo(() => {
    return legacy.letters.find((l) => l.id === selectedLetterId) ?? null;
  }, [legacy.letters, selectedLetterId]);

  function updateLetter(id: string, patch: Partial<LegacyLetter>) {
    setLegacy((prev) => {
      const next = { ...prev, letters: [...prev.letters] };
      const idx = next.letters.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      next.letters[idx] = { ...next.letters[idx], ...patch };
      return next;
    });
    setMsg(null);
  }

  function addLetter() {
    if (isLocked) return;

    const newId = uid("letter");
    const now = new Date().toISOString();

    const newLetter: LegacyLetter = {
      id: newId,
      recipientName: "Family Member",
      relationship: "",
      subject: "A letter for you",
      body: "",
      updatedAt: now,
    };

    setLegacy((prev) => ({
      ...prev,
      letters: [newLetter, ...prev.letters],
    }));
    setSelectedLetterId(newId);
    setMsg(null);
  }

  function deleteLetter(id: string) {
    if (isLocked) return;

    const remaining = legacy.letters.filter((l) => l.id !== id);

    setLegacy((prev) => ({
      ...prev,
      letters: remaining,
    }));

    setSelectedLetterId((cur) => {
      if (cur !== id) return cur;
      return remaining[0]?.id ?? "";
    });

    setMsg(null);
  }

  async function saveLegacy(nextLegacy: LegacyData) {
    const base = isObject(draftData) ? draftData : {};
    const merged = {
      ...base,
      legacy: nextLegacy,
    };

    const res = await fetch("/api/will/draft", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: merged,
      }),
    });

    const payload: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(getErr(payload, "Failed to save."));
    }

    setDraftData(merged);
  }

  async function onSaveLetters() {
    if (isLocked) return;

    setError(null);
    setMsg(null);
    setSavingLetters(true);

    try {
      const now = new Date().toISOString();
      const nextLetters = legacy.letters.map((l) =>
        l.id === selectedLetterId ? { ...l, updatedAt: now } : l
      );

      const nextLegacy: LegacyData = {
        ...legacy,
        letters: nextLetters,
      };

      await saveLegacy(nextLegacy);
      setLegacy(nextLegacy);
      setMsg("Letter saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSavingLetters(false);
    }
  }

  async function onSaveFuneral() {
    if (isLocked) return;

    setError(null);
    setMsg(null);
    setSavingFuneral(true);

    try {
      const now = new Date().toISOString();
      const nextLegacy: LegacyData = {
        ...legacy,
        funeral: { ...legacy.funeral, updatedAt: now },
      };

      await saveLegacy(nextLegacy);
      setLegacy(nextLegacy);
      setMsg("Funeral wishes saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSavingFuneral(false);
    }
  }

  function onPickVideosClick() {
    if (isLocked) return;
    fileInputRef.current?.click();
  }

  function onVideoFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (isLocked) return;

    setVideoMsg(null);
    setError(null);

    if (files.length === 0) return;

    if (videoItems.length >= MAX_VIDEO_COUNT) {
      setVideoMsg(`You can only add up to ${MAX_VIDEO_COUNT} videos.`);
      return;
    }

    const slotsLeft = MAX_VIDEO_COUNT - videoItems.length;
    const acceptedFiles = files.slice(0, slotsLeft);

    const nextItems: LegacyVideoItem[] = [];
    const rejected: string[] = [];

    for (const file of acceptedFiles) {
      if (!file.type.startsWith("video/")) {
        rejected.push(`${file.name}: not a video file`);
        continue;
      }

      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        rejected.push(
          `${file.name}: too large for one message slot`
        );
        continue;
      }

      nextItems.push({
        id: uid("video"),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        addedAt: new Date().toISOString(),
      });
    }

    if (files.length > slotsLeft) {
      rejected.push(`Only ${slotsLeft} slot(s) remaining`);
    }

    if (nextItems.length > 0) {
      setVideoItems((prev) => [...prev, ...nextItems]);
      setVideoMsg(
        "Videos added locally. Permanent upload storage still needs backend wiring."
      );
    }

    if (rejected.length > 0) {
      setError(rejected.join(" • "));
    }
  }

  function removeVideo(id: string) {
    if (isLocked) return;

    setVideoItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found?.previewUrl) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });

    setVideoMsg(null);
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#f8fafc] px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-100">
        Loading legacy…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {msg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {msg}
        </div>
      ) : null}

      {videoMsg ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {videoMsg}
        </div>
      ) : null}

      {isLocked ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          Your will is locked. Legacy editing is disabled until you unlock on Step 6.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <SectionCard
          title="Letters"
          subtitle="Private messages for specific people."
          action={
            <button
              type="button"
              onClick={addLetter}
              disabled={isLocked}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              New letter
            </button>
          }
        >
          <div className="space-y-2">
            {legacy.letters.length === 0 ? (
              <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-slate-600 ring-1 ring-slate-100">
                No letters yet. Create one to begin.
              </div>
            ) : (
              legacy.letters.map((l) => {
                const active = l.id === selectedLetterId;

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedLetterId(l.id)}
                    className={
                      active
                        ? "w-full rounded-2xl border border-[#cfdcf0] bg-[#f8fbff] px-4 py-3 text-left ring-2 ring-[#7b95bb]/15 transition"
                        : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {l.recipientName || "Unnamed recipient"}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {l.subject || "No subject"}
                        </div>
                      </div>

                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatShort(l.updatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Letter editor"
            subtitle="Write something personal, simple, and honest."
            action={
              <div className="flex gap-3">
                {selectedLetter ? (
                  <button
                    type="button"
                    onClick={() => deleteLetter(selectedLetter.id)}
                    disabled={isLocked}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onSaveLetters}
                  disabled={isLocked || savingLetters || !selectedLetter}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingLetters ? "Saving..." : "Save letter"}
                </button>
              </div>
            }
          >
            {!selectedLetter ? (
              <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-slate-600 ring-1 ring-slate-100">
                Select a letter from the left, or create a new one.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Recipient name">
                    <input
                      value={selectedLetter.recipientName}
                      onChange={(e) =>
                        updateLetter(selectedLetter.id, {
                          recipientName: e.target.value,
                        })
                      }
                      disabled={isLocked}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                      placeholder="e.g. Mom"
                    />
                  </Field>

                  <Field label="Relationship (optional)">
                    <input
                      value={selectedLetter.relationship ?? ""}
                      onChange={(e) =>
                        updateLetter(selectedLetter.id, {
                          relationship: e.target.value,
                        })
                      }
                      disabled={isLocked}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                      placeholder="e.g. Mother"
                    />
                  </Field>
                </div>

                <Field label="Subject">
                  <input
                    value={selectedLetter.subject}
                    onChange={(e) =>
                      updateLetter(selectedLetter.id, {
                        subject: e.target.value,
                      })
                    }
                    disabled={isLocked}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder="e.g. Thank you for everything"
                  />
                </Field>

                <Field
                  label="Message"
                  hint="The most meaningful letters are usually simple, honest, and specific."
                >
                  <textarea
                    value={selectedLetter.body}
                    onChange={(e) =>
                      updateLetter(selectedLetter.id, {
                        body: e.target.value,
                      })
                    }
                    disabled={isLocked}
                    rows={10}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder="Write your message here..."
                  />
                </Field>

                <div className="text-xs text-slate-500">
                  Last updated:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatShort(selectedLetter.updatedAt)}
                  </span>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Video vault"
            subtitle={`Add up to ${MAX_VIDEO_COUNT} videos. Up to ${ESTIMATED_VIDEO_MINUTES} minutes each in high quality.`}
            action={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={onVideoFilesSelected}
                />

                <button
                  type="button"
                  onClick={onPickVideosClick}
                  disabled={isLocked || videoItems.length >= MAX_VIDEO_COUNT}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add video
                </button>
              </>
            }
          >
            <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Private messages on video
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">
                    Record encouragement, guidance, gratitude, or personal messages for your loved ones.
                  </div>
                </div>

                <SoftPill>
                  {videoItems.length}/{MAX_VIDEO_COUNT} used
                </SoftPill>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/90 ring-1 ring-white/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7b95bb] to-[#6d87ad] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (videoItems.length / MAX_VIDEO_COUNT) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Recommended length
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {ESTIMATED_VIDEO_MINUTES} minutes each
                  </div>
                </div>

                <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Message style
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    Calm, personal, clear
                  </div>
                </div>

                <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Capacity
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    Up to {MAX_VIDEO_COUNT} private videos
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {videoItems.map((video) => (
                <div
                  key={video.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {video.fileName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatBytes(video.fileSize)} • {formatShort(video.addedAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      disabled={isLocked}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>

                  {video.previewUrl ? (
                    <video
                      src={video.previewUrl}
                      controls
                      className="mt-3 w-full rounded-2xl bg-slate-100"
                    />
                  ) : null}
                </div>
              ))}

              {Array.from({
                length: Math.max(0, MAX_VIDEO_COUNT - videoItems.length),
              }).map((_, index) => (
                <button
                  key={`empty-slot-${index}`}
                  type="button"
                  onClick={onPickVideosClick}
                  disabled={isLocked}
                  className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-4 text-center transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Ready for message {videoItems.length + index + 1}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-900">
                    Add a private video
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    Up to {ESTIMATED_VIDEO_MINUTES} minutes in high quality
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800 ring-1 ring-amber-200">
              Video slot limits are active now. Permanent upload storage and saved metadata still need backend support.
            </div>
          </SectionCard>

          <SectionCard
            title="Funeral wishes"
            subtitle="Preferences that can guide your family in a difficult moment."
            action={
              <button
                type="button"
                onClick={onSaveFuneral}
                disabled={isLocked || savingFuneral}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingFuneral ? "Saving..." : "Save wishes"}
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Song to play">
                <input
                  value={legacy.funeral.song ?? ""}
                  onChange={(e) =>
                    setLegacy((p) => ({
                      ...p,
                      funeral: { ...p.funeral, song: e.target.value },
                    }))
                  }
                  disabled={isLocked}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                  placeholder="e.g. Artist - Song Name"
                />
              </Field>

              <Field label="Flowers">
                <input
                  value={legacy.funeral.flowers ?? ""}
                  onChange={(e) =>
                    setLegacy((p) => ({
                      ...p,
                      funeral: { ...p.funeral, flowers: e.target.value },
                    }))
                  }
                  disabled={isLocked}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                  placeholder="e.g. White lilies"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Tombstone / inscription">
                  <input
                    value={legacy.funeral.tombstoneText ?? ""}
                    onChange={(e) =>
                      setLegacy((p) => ({
                        ...p,
                        funeral: {
                          ...p.funeral,
                          tombstoneText: e.target.value,
                        },
                      }))
                    }
                    disabled={isLocked}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder='e.g. "Forever loved, never forgotten"'
                  />
                </Field>
              </div>

              <Field label="Dress code (optional)">
                <input
                  value={legacy.funeral.dressCode ?? ""}
                  onChange={(e) =>
                    setLegacy((p) => ({
                      ...p,
                      funeral: { ...p.funeral, dressCode: e.target.value },
                    }))
                  }
                  disabled={isLocked}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                  placeholder="e.g. No black, bright colors"
                />
              </Field>

              <Field label="Location preference (optional)">
                <input
                  value={legacy.funeral.locationPreference ?? ""}
                  onChange={(e) =>
                    setLegacy((p) => ({
                      ...p,
                      funeral: {
                        ...p.funeral,
                        locationPreference: e.target.value,
                      },
                    }))
                  }
                  disabled={isLocked}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                  placeholder="e.g. Church name or venue"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Service notes">
                  <textarea
                    value={legacy.funeral.serviceNotes ?? ""}
                    onChange={(e) =>
                      setLegacy((p) => ({
                        ...p,
                        funeral: {
                          ...p.funeral,
                          serviceNotes: e.target.value,
                        },
                      }))
                    }
                    disabled={isLocked}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder="Any notes about the service, speakers, readings, etc."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Donations / charity (optional)">
                  <textarea
                    value={legacy.funeral.donations ?? ""}
                    onChange={(e) =>
                      setLegacy((p) => ({
                        ...p,
                        funeral: { ...p.funeral, donations: e.target.value },
                      }))
                    }
                    disabled={isLocked}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder="If you'd prefer donations to a charity, list it here."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Additional notes">
                  <textarea
                    value={legacy.funeral.additionalNotes ?? ""}
                    onChange={(e) =>
                      setLegacy((p) => ({
                        ...p,
                        funeral: {
                          ...p.funeral,
                          additionalNotes: e.target.value,
                        },
                      }))
                    }
                    disabled={isLocked}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15 disabled:bg-slate-100"
                    placeholder="Anything else your family should know."
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Last updated:{" "}
              <span className="font-semibold text-slate-700">
                {formatShort(legacy.funeral.updatedAt)}
              </span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}