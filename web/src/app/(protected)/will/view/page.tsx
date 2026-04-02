import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDraftStateByUserId } from "@/lib/draft";

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

type PersonalDetails = {
  fullName?: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function totalPercent(allocs: Allocation[]) {
  return allocs.reduce((sum, a) => sum + (Number.isFinite(a.percentage) ? a.percentage : 0), 0);
}

function safePersonalDetails(data: unknown): PersonalDetails | null {
  if (!isObject(data)) return null;
  const p = data.personalDetails;
  if (!isObject(p)) return null;

  const out: PersonalDetails = {};
  const pick = (k: keyof PersonalDetails) => {
    const v = p[k as string];
    if (typeof v === "string" && v.trim().length > 0) out[k] = v;
  };

  pick("fullName");
  pick("idNumber");
  pick("email");
  pick("phone");
  pick("address");
  pick("city");
  pick("province");
  pick("postalCode");

  return Object.keys(out).length ? out : null;
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
    const description = typeof item.description === "string" ? item.description : "";
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
    const relationship = typeof item.relationship === "string" ? item.relationship : "";
    const isMinor = typeof item.isMinor === "boolean" ? item.isMinor : false;
    if (!id || !fullName) continue;
    out.push({ id, fullName, relationship, isMinor });
  }
  return out;
}

function safeExecutors(data: unknown): { primary: Executor | null; alternate: Executor | null } {
  if (!isObject(data)) return { primary: null, alternate: null };
  const ex = data.executors;
  if (!isObject(ex)) return { primary: null, alternate: null };

  const primary = isObject(ex.primary)
    ? {
        fullName: typeof ex.primary.fullName === "string" ? ex.primary.fullName : "",
        idNumber: typeof ex.primary.idNumber === "string" ? ex.primary.idNumber : "",
        email: typeof ex.primary.email === "string" ? ex.primary.email : "",
        phone: typeof ex.primary.phone === "string" ? ex.primary.phone : "",
      }
    : null;

  const alternate = isObject(ex.alternate)
    ? {
        fullName: typeof ex.alternate.fullName === "string" ? ex.alternate.fullName : "",
        idNumber: typeof ex.alternate.idNumber === "string" ? ex.alternate.idNumber : "",
        email: typeof ex.alternate.email === "string" ? ex.alternate.email : "",
        phone: typeof ex.alternate.phone === "string" ? ex.alternate.phone : "",
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
      const beneficiaryId = typeof a.beneficiaryId === "string" ? a.beneficiaryId : "";
      const percentage = typeof a.percentage === "number" ? a.percentage : NaN;
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
      id: typeof item.id === "string" ? item.id : "",
      fullName: typeof item.fullName === "string" ? item.fullName : "",
      idNumber: typeof item.idNumber === "string" ? item.idNumber : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      email: typeof item.email === "string" ? item.email : "",
    });
  }
  return out;
}

export default async function WillViewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draftState = await getDraftStateByUserId(user.id);
  if (!draftState.exists) redirect("/will/start");

  const draft = await prisma.willDraft.findUnique({
    where: { userId: user.id },
    select: { status: true, updatedAt: true, data: true },
  });

  if (!draft) redirect("/will/start");

  const status = (draft.status as DraftStatus) ?? "DRAFT";
  const isLocked = status === "LOCKED";

  const data = draft.data as unknown;

  const personal = safePersonalDetails(data);
  const assets = safeAssets(data);
  const beneficiaries = safeBeneficiaries(data);
  const executors = safeExecutors(data);
  const distributions = safeDistributions(data);
  const witnesses = safeWitnesses(data);

  const beneficiaryById = new Map<string, Beneficiary>();
  for (const b of beneficiaries) beneficiaryById.set(b.id, b);

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader myWillHref={isLocked ? "/will/step/6" : `/will/step/${draftState.step}`} />

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-600">My Will</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {isLocked ? "Locked Will Record" : "Will Preview (Draft)"}
            </h1>
            <div className="mt-2 text-sm text-slate-600">
              Last updated: <span className="font-semibold text-slate-900">{formatDate(draft.updatedAt)}</span>
              {" • "}
              Status:{" "}
              <span className={isLocked ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                {status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>

            {!isLocked ? (
              <Link
                href={`/will/step/${draftState.step}`}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Resume Editing
              </Link>
            ) : (
              <Link
                href="/will/step/6"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Unlock &amp; Edit
              </Link>
            )}

            {/* Browser print for demo; real PDF endpoint later */}
            <button
              type="button"
              onClick={() => {
                // handled client-side by browser; we keep it as a normal button via a tiny client wrapper later if needed
              }}
              className="hidden"
            >
              Print
            </button>
          </div>
        </div>

        {/* Print hint */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          For demo: use your browser’s <span className="font-semibold">Print</span> → <span className="font-semibold">Save as PDF</span>.
          We’ll add a true one-click PDF download next.
        </div>

        {/* Document */}
        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 pb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last Will and Testament
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {personal?.fullName ?? user.fullName ?? "Testator"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Generated by WillMyWay • {formatDate(draft.updatedAt)}
            </div>
          </div>

          {/* Personal Details */}
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">1. Personal Details</h2>
            {personal ? (
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-900">Full name:</span>{" "}
                  {personal.fullName ?? "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">ID / Passport:</span>{" "}
                  {personal.idNumber ?? "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  {personal.email ?? "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Phone:</span>{" "}
                  {personal.phone ?? "—"}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-900">Address:</span>{" "}
                  {[personal.address, personal.city, personal.province, personal.postalCode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-600">No personal details captured.</div>
            )}
          </section>

          {/* Executors */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">2. Executors</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Primary:</span>{" "}
                {executors.primary?.fullName ? executors.primary.fullName : "—"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Alternate:</span>{" "}
                {executors.alternate?.fullName ? executors.alternate.fullName : "—"}
              </div>
            </div>
          </section>

          {/* Beneficiaries */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">3. Beneficiaries</h2>
            {beneficiaries.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">No beneficiaries captured.</div>
            ) : (
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
                {beneficiaries.map((b) => (
                  <li key={b.id}>
                    {b.fullName}{" "}
                    <span className="text-slate-500">
                      ({b.relationship}){b.isMinor ? " • Minor" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Assets + Distributions */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">4. Assets and Distributions</h2>
            {assets.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">No assets captured.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {assets.map((a) => {
                  const allocs = distributions[a.id] ?? [];
                  const total = round2(totalPercent(allocs));
                  const totalOk = total === 100;

                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-semibold text-slate-900">
                          {a.type}: {a.description}{" "}
                          {a.value !== null ? (
                            <span className="font-normal text-slate-600">({formatZAR(a.value)})</span>
                          ) : null}
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            totalOk ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          Total: {total}%
                        </div>
                      </div>

                      {allocs.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-700">No allocations captured.</div>
                      ) : (
                        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
                          {allocs.map((x, idx) => {
                            const b = beneficiaryById.get(x.beneficiaryId);
                            return (
                              <li key={`${a.id}_${idx}`}>
                                {b ? b.fullName : "Unknown beneficiary"} — {x.percentage}%
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Witnesses */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">5. Witnesses</h2>
            {witnesses.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">No witnesses captured.</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {witnesses.slice(0, 2).map((w, idx) => (
                  <div key={w.id || `${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Witness {idx + 1}</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">Name:</span>{" "}
                        {w.fullName || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">ID:</span>{" "}
                        {w.idNumber || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Phone:</span>{" "}
                        {w.phone || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Email:</span>{" "}
                        {w.email || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
            This document is a digital record generated by WillMyWay for demo purposes.
            Formal legal formatting and jurisdiction rules will be refined in later phases.
          </div>
        </div>
      </section>
    </main>
  );
}