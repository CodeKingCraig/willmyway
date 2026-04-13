import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/session";
import { getDraftStateByUserId } from "@/lib/draft";
import {
  getOnboardingStateByUserId,
  getOnboardingPersonalisation,
} from "@/lib/onboarding";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getPlanMeta(plan: "ESSENTIAL" | "LEGACY" | "FAMILY_VAULT" | "FULL") {
  switch (plan) {
    case "LEGACY":
      return {
        label: "Legacy",
        badgeClass: "bg-[#f3e8d2] text-slate-800 ring-[#ead9b8]",
        description:
          "A once-off premium will experience with legacy-focused upgrades and a stronger guided journey.",
        billingType: "Once-off",
        priceLabel: "R349 once-off",
        features: [
          "Premium will experience",
          "Legacy tools access",
          "Enhanced guidance",
          "Priority premium positioning",
        ],
      };

    case "FAMILY_VAULT":
      return {
        label: "Family Vault",
        badgeClass: "bg-[#e8f4ee] text-emerald-800 ring-[#cfe7d9]",
        description:
          "A once-off premium family-focused plan designed for broader estate organisation and future family tools.",
        billingType: "Once-off",
        priceLabel: "R699 once-off",
        features: [
          "Everything in Legacy",
          "Family-focused planning",
          "Vault-oriented premium access",
          "Future family storage expansion",
        ],
      };

    case "FULL":
      return {
        label: "Full Access",
        badgeClass: "bg-slate-900 text-white ring-slate-700",
        description:
          "Internal full-access plan used for admin, testing, and complete platform unlocks.",
        billingType: "Internal",
        priceLabel: "Internal only",
        features: [
          "All premium plan access",
          "Internal testing unlocks",
          "Full feature visibility",
          "Admin/test environment support",
        ],
      };

    case "ESSENTIAL":
    default:
      return {
        label: "Essential",
        badgeClass: "bg-white text-slate-800 ring-slate-200",
        description:
          "Your free foundational plan for starting your will journey and progressing through the core experience.",
        billingType: "Free",
        priceLabel: "Free",
        features: [
          "Core will journey",
          "Protected dashboard",
          "Saved draft progress",
          "Premium upgrades available",
        ],
      };
  }
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
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-500">
        <span>Will progress</span>
        <span className="font-semibold text-slate-700">{value}% complete</span>
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

function LumaGuidanceCard({
  focus,
  isLocked,
  resumeHref,
  reviewHref,
  progressPercent,
}: {
  focus: string;
  isLocked: boolean;
  resumeHref: string;
  reviewHref: string;
  progressPercent: number;
}) {
  const nextStepCopy = isLocked
    ? "Your will is locked. Luma recommends reviewing your final version and downloading your latest PDF for safe keeping."
    : "Luma recommends continuing your next unfinished will step while your details are still fresh and easy to review.";

  const encouragementCopy = isLocked
    ? "You’ve completed the core will flow. This is the ideal time to add legacy detail and tidy any final wording."
    : `You are ${progressPercent}% through your will. A few focused minutes now will move you meaningfully closer to completion.`;

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/72 p-7 shadow-[0_22px_70px_rgba(148,163,184,0.14)] backdrop-blur-md lg:col-span-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(123,149,187,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(232,220,196,0.24),_transparent_28%)]" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div>
          <div className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-white/80">
            Luma guidance
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-[2.1rem]">
            A calmer way to keep moving forward
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Luma is keeping your dashboard focused around what matters most right
            now: clarity, momentum, and a more guided premium experience.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-white/88 p-4 ring-1 ring-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Recommended next move
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-700">
                {nextStepCopy}
              </div>
            </div>

            <div className="rounded-3xl bg-[#f8fbff] p-4 ring-1 ring-[#e2ebf6]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Luma sees your focus
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-700">
                {focus}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Encouragement
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-700">
              {encouragementCopy}
            </div>
          </div>
        </div>

        <div className="rounded-[30px] bg-white/84 p-5 ring-1 ring-white/80 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Today with Luma
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[#f4fbf7] p-4 ring-1 ring-[#dfeee6]">
              <div className="text-sm font-semibold text-slate-900">
                1. Continue with confidence
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Resume your will without losing your place or momentum.
              </div>
            </div>

            <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-white/80">
              <div className="text-sm font-semibold text-slate-900">
                2. Review before finalising
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Step 6 remains your cleanest place to review wording and overall
                clarity.
              </div>
            </div>

            <div className="rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
              <div className="text-sm font-semibold text-slate-900">
                3. Add emotional value later
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Once the core will is solid, legacy tools can help you leave
                more than instructions.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link
              href={resumeHref}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
            >
              {isLocked ? "Open Final Review" : "Continue My Will"}
            </Link>

            <Link
              href={reviewHref}
              className="inline-flex items-center justify-center rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 transition hover:bg-white"
            >
              Review Step 6
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalisedInsightCard({
  focus,
  legacyPrompt,
  familyPrompt,
  carePrompt,
}: {
  focus: string;
  legacyPrompt: string;
  familyPrompt: string;
  carePrompt: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/72 p-7 shadow-[0_22px_70px_rgba(148,163,184,0.14)] backdrop-blur-md lg:col-span-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(232,220,196,0.20),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(123,149,187,0.14),_transparent_30%)]" />

      <div className="relative z-10">
        <div className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-white/80">
          Personalised insight
        </div>

        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-[2.1rem]">
          Guidance shaped around your journey
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Your dashboard personalisation reflects the information you shared
          during onboarding, helping WillMyWay keep the experience more relevant
          and emotionally aligned.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[#f8fbff] p-4 ring-1 ring-[#e2ebf6]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Your dashboard focus
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-700">{focus}</div>
          </div>

          <div className="rounded-3xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Legacy direction
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-700">
              {legacyPrompt}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 p-4 ring-1 ring-white/80">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Family Vault signal
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-700">
              {familyPrompt}
            </div>
          </div>

          <div className="rounded-3xl bg-[#f4fbf7] p-4 ring-1 ring-[#dfeee6]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Care layer signal
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-700">
              {carePrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const [draftState, onboardingState] = await Promise.all([
    getDraftStateByUserId(user.id),
    getOnboardingStateByUserId(user.id),
  ]);

  if (!draftState.exists) {
    redirect("/will/start");
  }

  const personalisation = getOnboardingPersonalisation(onboardingState.answers);

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

  const planMeta = getPlanMeta(user.basePlan);
  const careIsActive = user.careActive && user.careStatus === "ACTIVE";
  const hasLegacyAccess =
    user.basePlan === "LEGACY" ||
    user.basePlan === "FAMILY_VAULT" ||
    user.basePlan === "FULL";

  async function logoutAction() {
    "use server";

    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-[34px] border border-white/70 bg-white/60 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.10)] backdrop-blur-md">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
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
                    Your will journey is saved. Pick up where you left off,
                    review your final step, or return to key sections that need
                    attention.
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>

            <ProgressBar value={progressPercent} />

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current status
                </div>
                <div className="mt-3 flex items-center gap-2">
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
              </div>

              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Last updated
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {formatDate(draftState.updatedAt)}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Your progress is safely saved.
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fbff] p-4 ring-1 ring-[#e2ebf6]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current plan
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${planMeta.badgeClass}`}
                  >
                    {planMeta.label}
                  </span>
                  {careIsActive ? (
                    <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-[#d8e4fb]">
                      + Care
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Base plan: {planMeta.priceLabel}
                </div>
              </div>

              <div className="rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Billing type
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {careIsActive
                    ? `${planMeta.billingType} + Care active`
                    : planMeta.billingType}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Plan visibility is now shown clearly on your dashboard.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <LumaGuidanceCard
              focus={personalisation.dashboardFocus}
              isLocked={isLocked}
              resumeHref={resumeHref}
              reviewHref={reviewHref}
              progressPercent={progressPercent}
            />

            <PersonalisedInsightCard
              focus={personalisation.dashboardFocus}
              legacyPrompt={personalisation.legacyPrompt}
              familyPrompt={personalisation.familyPrompt}
              carePrompt={personalisation.carePrompt}
            />

            <DashboardCard
              title="Current Plan"
              subtitle="Your dashboard now clearly shows your base plan, care add-on status, how it bills, and what it unlocks."
              accent="gold"
            >
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white/80">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${planMeta.badgeClass}`}
                  >
                    {planMeta.label}
                  </span>
                  {careIsActive ? (
                    <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-[#d8e4fb]">
                      Care Active
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-slate-900">
                    {planMeta.priceLabel}
                  </span>
                </div>

                <div className="mt-4 text-sm leading-6 text-slate-600">
                  {planMeta.description}
                  {careIsActive
                    ? " Your WillMyWay Care add-on is currently active and attached to this base plan."
                    : ""}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f8fbff] p-4 ring-1 ring-[#e2ebf6]">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Billing
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {planMeta.billingType}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Care add-on
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {careIsActive ? "Active" : "Not active"}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-slate-900">
                    Unlocked features
                  </div>
                  <div className="mt-3 grid gap-3">
                    {planMeta.features.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl bg-white/85 px-4 py-3 text-sm text-slate-700 ring-1 ring-white/80"
                      >
                        {feature}
                      </div>
                    ))}
                    {careIsActive ? (
                      <div className="rounded-2xl bg-[#eef4ff] px-4 py-3 text-sm text-blue-800 ring-1 ring-[#d8e4fb]">
                        WillMyWay Care add-on active
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <Link
                  href="/checkout?plan=legacy"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  View Premium Options
                </Link>
              </div>
            </DashboardCard>

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
                    Unlock &amp; Edit from Review
                  </Link>
                )}
              </div>
            </DashboardCard>

            <DashboardCard
              title="Important Sections"
              subtitle="Jump straight back into the sections that typically need the most care."
              accent="gold"
            >
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href={editStep3Href}
                  className="rounded-2xl bg-white/80 px-4 py-4 text-sm font-semibold text-slate-800 ring-1 ring-white/80 transition hover:bg-white"
                >
                  Executors & Guardians
                </Link>

                <Link
                  href={editStep4Href}
                  className="rounded-2xl bg-white/80 px-4 py-4 text-sm font-semibold text-slate-800 ring-1 ring-white/80 transition hover:bg-white"
                >
                  Assets & Estate
                </Link>

                <Link
                  href={editStep5Href}
                  className="rounded-2xl bg-white/80 px-4 py-4 text-sm font-semibold text-slate-800 ring-1 ring-white/80 transition hover:bg-white"
                >
                  Distribution Wishes
                </Link>
              </div>

              <div className="mt-5 rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                <div className="text-sm font-semibold text-slate-900">
                  Luma guidance
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  The strongest wills are clear, specific, and reviewed with
                  care. Revisit any section before locking your final version.
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Premium Legacy"
              subtitle="Add emotional value to your estate planning with legacy tools and storage."
              accent="emerald"
            >
              <div className="grid grid-cols-1 gap-3">
                {hasLegacyAccess ? (
                  <Link
                    href="/legacy"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7cc39a] to-[#64ad84] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(100,173,132,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(100,173,132,0.28)]"
                  >
                    Open Legacy Vault
                  </Link>
                ) : (
                  <Link
                    href="/checkout?plan=legacy"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                  >
                    Upgrade to Legacy
                  </Link>
                )}

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                >
                  Family Vault (Coming Soon)
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                >
                  WillMyWay Care (Coming Soon)
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
                  <div className="text-sm font-semibold text-slate-900">
                    Legacy prompt
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {personalisation.legacyPrompt}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f4fbf7] p-4 ring-1 ring-[#dfeee6]">
                  <div className="text-sm font-semibold text-slate-900">
                    Family Vault fit
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {personalisation.familyPrompt}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                  <div className="text-sm font-semibold text-slate-900">
                    Care insight
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {personalisation.carePrompt}
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </section>
    </main>
  );
}