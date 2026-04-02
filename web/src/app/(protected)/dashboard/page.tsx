import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDraftStateByUserId } from "@/lib/draft";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function DashboardCard({
  title,
  subtitle,
  children,
  accent = "blue",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "blue" | "gold" | "emerald";
}) {
  const accentMap = {
    blue: "from-[#dce8f6] to-transparent",
    gold: "from-[#f3e8d2] to-transparent",
    emerald: "from-[#d9f4e8] to-transparent",
  };

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/68 p-6 shadow-[0_18px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]} opacity-30`}
      />
      <div className="relative z-10">
        <div className="text-xl font-semibold text-slate-900">{title}</div>
        {subtitle ? (
          <div className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</div>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Will progress</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-white/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7b95bb] to-[#6d87ad] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draftState = await getDraftStateByUserId(user.id);

  if (!draftState.exists) {
    redirect("/will/start");
  }

  const isLocked = draftState.status === "LOCKED";
  const currentStep = draftState.step ?? 1;

  const resumeHref = isLocked ? "/will/step/6" : `/will/step/${currentStep}`;
  const reviewHref = "/will/step/6";

  const editStep3Href = isLocked ? reviewHref : "/will/step/3";
  const editStep4Href = isLocked ? reviewHref : "/will/step/4";
  const editStep5Href = isLocked ? reviewHref : "/will/step/5";

  const progressPercent = isLocked
    ? 100
    : Math.max(8, Math.min(100, Math.round((currentStep / 6) * 100)));

  const statusBadge = isLocked
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-[34px] border border-white/70 bg-white/60 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.10)] backdrop-blur-md">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/80 ring-1 ring-white/80 shadow-sm backdrop-blur">
                  <img
                    src="/luma.png"
                    alt="luma"
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Dashboard
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                    Welcome back{user.fullName ? `, ${user.fullName}` : ""}.
                  </h1>
                  <div className="mt-2 text-sm text-slate-600">
                    Signed in as{" "}
                    <span className="font-semibold text-slate-800">
                      {user.email}
                    </span>
                  </div>
                  <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Your will journey is saved. Pick up where you left off, review your final step, or return to key sections that need attention.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={resumeHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  {isLocked ? "View Locked Will" : "Resume My Will"}
                </Link>

                <Link
                  href={reviewHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white"
                >
                  Review Step 6
                </Link>
              </div>
            </div>

            <ProgressBar value={progressPercent} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <DashboardCard
              title="My Will"
              subtitle="Your current will progress, lock status, and latest activity."
              accent={isLocked ? "emerald" : "blue"}
            >
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/70">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge}`}
                  >
                    {isLocked ? "LOCKED" : "DRAFT"}
                  </span>
                  <span className="text-sm text-slate-600">
                    Step{" "}
                    <span className="font-semibold text-slate-900">
                      {isLocked ? 6 : currentStep}
                    </span>{" "}
                    / 6
                  </span>
                </div>

                <div className="mt-4 text-sm text-slate-600">Last updated</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(draftState.updatedAt)}
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      isLocked ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isLocked ? "Locked" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <Link
                  href={resumeHref}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  {isLocked ? "Open Final Review" : "Resume"}
                </Link>

                <Link
                  href={reviewHref}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-white/80 transition hover:bg-white"
                >
                  Review (Step 6)
                </Link>

                {isLocked ? (
                  <a
                    href="/api/will/pdf"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:shadow-md"
                  >
                    Download Will PDF
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                  >
                    Download Will PDF
                  </button>
                )}

                {isLocked && (
                  <Link
                    href={reviewHref}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 transition hover:bg-white"
                  >
                    Unlock &amp; Edit
                  </Link>
                )}
              </div>

              <div className="mt-4 text-xs leading-6 text-slate-500">
                {isLocked
                  ? "Locked wills can be viewed on Step 6. Unlock from the review screen to edit."
                  : "Lock your will on Step 6 to enable PDF download."}
              </div>
            </DashboardCard>

            <DashboardCard
              title="Quick Actions"
              subtitle="Fast jumps for common edits in your current will."
              accent="gold"
            >
              <div className="flex flex-col gap-3">
                <Link
                  href={editStep3Href}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isLocked
                      ? "bg-slate-200 text-slate-500"
                      : "bg-white/75 text-slate-800 ring-1 ring-white/80 hover:bg-white"
                  }`}
                  aria-disabled={isLocked}
                >
                  Edit Step 3 (Executors)
                </Link>

                <Link
                  href={editStep4Href}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isLocked
                      ? "bg-slate-200 text-slate-500"
                      : "bg-white/75 text-slate-800 ring-1 ring-white/80 hover:bg-white"
                  }`}
                  aria-disabled={isLocked}
                >
                  Edit Step 4 (Assets)
                </Link>

                <Link
                  href={editStep5Href}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isLocked
                      ? "bg-slate-200 text-slate-500"
                      : "bg-white/75 text-slate-800 ring-1 ring-white/80 hover:bg-white"
                  }`}
                  aria-disabled={isLocked}
                >
                  Edit Step 5 (Distributions)
                </Link>
              </div>

              {isLocked ? (
                <div className="mt-4 rounded-2xl bg-white/70 p-4 text-xs leading-6 text-slate-600 ring-1 ring-white/70">
                  Your will is locked. Use <span className="font-semibold">Unlock &amp; Edit</span> on Step 6 before making changes.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4 text-xs leading-6 text-slate-600 ring-1 ring-[#e8edf5]">
                  Jump directly to the sections that usually need the most adjustment before final review.
                </div>
              )}
            </DashboardCard>

            <DashboardCard
              title="Legacy"
              subtitle="A soft preview of the next emotional layer of WillMyWay."
              accent="gold"
            >
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/70">
                <div className="text-sm font-semibold text-slate-900">
                  Legacy planning setup
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Coming soon: personal letters, secure vault features, and guided support for the people you leave behind.
                </div>
              </div>

              <Link
                href="/legacy"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:shadow-md"
              >
                Go to Legacy →
              </Link>
            </DashboardCard>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/70 bg-white/55 p-5 text-sm text-slate-600 shadow-[0_12px_35px_rgba(148,163,184,0.08)] backdrop-blur-md">
            <span className="font-semibold text-slate-900">Access</span> is coming soon. You’ll be able to manage witnesses and trusted emergency access from one calm, secure place.
          </div>
        </div>
      </section>
    </main>
  );
}
