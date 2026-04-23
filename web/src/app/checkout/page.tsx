import Link from "next/link";

type BasePlanKey = "essential" | "legacy" | "family-vault";

type BasePlan = {
  key: BasePlanKey;
  label: string;
  title: string;
  subtitle: string;
  price: string;
  billing: string;
  summaryDescription: string;
  highlights: string[];
};

type CheckoutSummary = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  summaryTitle: string;
  summaryDescription: string;
  pricingPrimary: string;
  pricingSecondary: string;
  highlights: string[];
  selectedBase: BasePlan | null;
  careSelected: boolean;
};

const BASE_PLANS: Record<BasePlanKey, BasePlan> = {
  essential: {
    key: "essential",
    label: "Essential",
    title: "Essential",
    subtitle:
      "Your foundational KeepSave plan for getting your will journey started with clarity and structure.",
    price: "Free",
    billing: "Free",
    summaryDescription:
      "A strong starting point for users who want the core will experience, saved progress, and a clean protected dashboard.",
    highlights: [
      "Core will journey",
      "Protected dashboard access",
      "Saved draft progress",
      "Premium upgrades available later",
    ],
  },

  legacy: {
    key: "legacy",
    label: "Legacy",
    title: "Legacy",
    subtitle:
      "A once-off premium plan for users who want a more meaningful, guided, and emotionally rich estate planning experience.",
    price: "R349",
    billing: "Once-off",
    summaryDescription:
      "A private emotional layer for your estate planning, designed to help you leave more than instructions.",
    highlights: [
      "Personal letters for loved ones",
      "Private messages and reflections",
      "Funeral wishes and final guidance",
      "A more meaningful legacy experience",
    ],
  },

  "family-vault": {
    key: "family-vault",
    label: "Family Vault",
    title: "Family Vault",
    subtitle:
      "A premium once-off family-focused plan for stronger household continuity, safer planning, and future-ready organisation.",
    price: "R699",
    billing: "Once-off",
    summaryDescription:
      "A premium family-focused layer for households that want stronger structure, safer planning, and long-term continuity.",
    highlights: [
      "Everything in Legacy",
      "Family-focused planning tools",
      "Vault-oriented premium access",
      "Future family storage expansion",
    ],
  },
};

const CARE_ADDON = {
  label: "KeepSave Care",
  price: "R49",
  billing: "Per month",
  description:
    "A monthly add-on for users who want a more guided, reassuring, and supported KeepSave experience.",
  highlights: [
    "Ongoing support positioning",
    "A more guided experience",
    "Confidence and reassurance",
    "Premium monthly care layer",
  ],
};

function PaymentCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wmw-glass rounded-[30px] p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>

        <span className="rounded-full bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-white/70">
          {badge}
        </span>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  billing,
  description,
  href,
  selected,
  badge,
}: {
  title: string;
  price: string;
  billing: string;
  description: string;
  href: string;
  selected?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border p-6 shadow-sm backdrop-blur-md transition ${
        selected
          ? "border-[#d8e4fb] bg-[#f8fbff] ring-1 ring-[#d8e4fb]"
          : "border-white/70 bg-white/70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">{title}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {badge ? (
          <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-white/80">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6 rounded-2xl bg-white/85 p-4 ring-1 ring-white/80">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Pricing
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-800">
          {price}
        </div>
        <div className="mt-1 text-sm text-slate-600">{billing}</div>
      </div>

      <div className="mt-5">
        <Link
          href={href}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            selected
              ? "bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
              : "bg-white/75 text-slate-800 ring-1 ring-white/80 hover:bg-white"
          }`}
        >
          {selected ? "Selected" : "Choose Plan"}
        </Link>
      </div>
    </div>
  );
}

function buildCheckoutSummary(
  planParam?: string,
  careParam?: string,
  addonParam?: string,
): CheckoutSummary {
  const selectedBase =
    planParam === "essential" || planParam === "legacy" || planParam === "family-vault"
      ? BASE_PLANS[planParam]
      : null;

  const careSelected =
    careParam === "true" || addonParam === "care" || planParam === "care";

  if (selectedBase && careSelected) {
    return {
      heroBadge: `${selectedBase.label} + Care`,
      heroTitle: `${selectedBase.label} with Care`,
      heroSubtitle: `You’re preparing to continue with the ${selectedBase.label} base plan and add KeepSave Care as a monthly support layer.`,
      summaryTitle: `${selectedBase.label} + KeepSave Care`,
      summaryDescription: `${selectedBase.summaryDescription} KeepSave Care adds a monthly support layer for a more guided and reassuring premium experience.`,
      pricingPrimary: `${selectedBase.price} + ${CARE_ADDON.price}`,
      pricingSecondary: `${selectedBase.billing} + ${CARE_ADDON.billing}`,
      highlights: [...selectedBase.highlights, ...CARE_ADDON.highlights],
      selectedBase,
      careSelected: true,
    };
  }

  if (selectedBase) {
    return {
      heroBadge: selectedBase.label,
      heroTitle: `${selectedBase.title} checkout`,
      heroSubtitle: `You’re preparing to continue with the ${selectedBase.label} base plan.`,
      summaryTitle: selectedBase.label,
      summaryDescription: selectedBase.summaryDescription,
      pricingPrimary: selectedBase.price,
      pricingSecondary: selectedBase.billing,
      highlights: selectedBase.highlights,
      selectedBase,
      careSelected: false,
    };
  }

  if (careSelected) {
    return {
      heroBadge: "Care Add-on",
      heroTitle: "KeepSave Care add-on",
      heroSubtitle:
        "KeepSave Care is a monthly add-on and is only intended to sit on top of a base plan.",
      summaryTitle: "KeepSave Care",
      summaryDescription:
        "Choose a base plan first, then add KeepSave Care for ongoing support and a more guided premium experience.",
      pricingPrimary: CARE_ADDON.price,
      pricingSecondary: `${CARE_ADDON.billing} add-on`,
      highlights: CARE_ADDON.highlights,
      selectedBase: null,
      careSelected: true,
    };
  }

  return {
    heroBadge: "Base Plans + Add-on",
    heroTitle: "Checkout",
    heroSubtitle:
      "Choose your base plan first, then optionally add KeepSave Care as a monthly support layer.",
    summaryTitle: "Selected plan",
    summaryDescription:
      "Public checkout now separates your base plan from your optional Care add-on, making pricing and access clearer.",
    pricingPrimary: "Select plan",
    pricingSecondary: "Base plan required before Care add-on",
    highlights: [
      "Choose Essential, Legacy, or Family Vault",
      "Care is now an add-on, not a standalone base plan",
      "FULL remains hidden from public checkout",
      "Premium pre-launch payment view preserved",
    ],
    selectedBase: null,
    careSelected: false,
  };
}

function getCareHref(selectedBase: BasePlan | null, careSelected: boolean) {
  const plan = selectedBase?.key ?? "legacy";

  if (careSelected) {
    return `/checkout?plan=${plan}`;
  }

  return `/checkout?plan=${plan}&care=true`;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; care?: string; addon?: string }>;
}) {
  const params = await searchParams;
  const checkout = buildCheckoutSummary(params.plan, params.care, params.addon);

  return (
    <main className="wmw-page">
      <div className="wmw-bg-image" />
      <div className="wmw-overlay" />

      <div className="wmw-content">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60 ring-1 ring-white/70 shadow-sm backdrop-blur">
              <img
                src="/luma.png"
                alt="Luma"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              KeepSave
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-2xl bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white/80"
            >
              Back
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-[#efe5cf] px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-[#eadfca] shadow-sm transition hover:bg-[#eadfca]"
            >
              Create Account
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-6 pb-8 pt-10 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-white/70 backdrop-blur">
            {checkout.heroBadge}
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
            {checkout.heroTitle}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-[1.2rem]">
            {checkout.heroSubtitle}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-[32px] border border-white/70 bg-white/70 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Base plans
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Choose your foundation first
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Essential, Legacy, and Family Vault are your public base plans.
                KeepSave Care now sits on top as an optional monthly add-on.
              </p>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <PlanCard
                  title="Essential"
                  price={BASE_PLANS.essential.price}
                  billing={BASE_PLANS.essential.billing}
                  description={BASE_PLANS.essential.subtitle}
                  href="/checkout?plan=essential"
                  selected={checkout.selectedBase?.key === "essential"}
                  badge="Base Plan"
                />

                <PlanCard
                  title="Legacy"
                  price={BASE_PLANS.legacy.price}
                  billing={BASE_PLANS.legacy.billing}
                  description={BASE_PLANS.legacy.subtitle}
                  href="/checkout?plan=legacy"
                  selected={checkout.selectedBase?.key === "legacy"}
                  badge="Base Plan"
                />

                <PlanCard
                  title="Family Vault"
                  price={BASE_PLANS["family-vault"].price}
                  billing={BASE_PLANS["family-vault"].billing}
                  description={BASE_PLANS["family-vault"].subtitle}
                  href="/checkout?plan=family-vault"
                  selected={checkout.selectedBase?.key === "family-vault"}
                  badge="Base Plan"
                />
              </div>

              <div className="mt-8 rounded-[28px] border border-[#dfeee6] bg-[#f4fbf7] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                      Optional add-on
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      KeepSave Care
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      {CARE_ADDON.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-white/80">
                    Monthly Add-on
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {CARE_ADDON.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl bg-white/85 px-4 py-4 text-sm font-medium text-slate-700 ring-1 ring-white/80"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-2xl bg-white/85 px-4 py-4 ring-1 ring-white/80">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Care pricing
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                      {CARE_ADDON.price}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {CARE_ADDON.billing}
                    </div>
                  </div>

                  <Link
                    href={getCareHref(checkout.selectedBase, checkout.careSelected)}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      checkout.careSelected
                        ? "bg-white/75 text-slate-800 ring-1 ring-white/80 hover:bg-white"
                        : "bg-gradient-to-b from-[#7cc39a] to-[#64ad84] text-white shadow-[0_10px_24px_rgba(100,173,132,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(100,173,132,0.28)]"
                    }`}
                  >
                    {checkout.careSelected ? "Remove Care Add-on" : "Add Care Monthly"}
                  </Link>
                </div>

                <div className="mt-4 text-sm text-slate-500">
                  Care is not presented as a standalone public base plan.
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/70 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Plan summary
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    {checkout.summaryTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {checkout.summaryDescription}
                  </p>
                </div>

                <div className="min-w-[180px] rounded-[28px] bg-white/85 p-5 text-center ring-1 ring-white/80 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Pricing
                  </div>
                  <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-800">
                    {checkout.pricingPrimary}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {checkout.pricingSecondary}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {checkout.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-2xl bg-white/85 px-4 py-4 text-sm font-medium text-slate-700 ring-1 ring-white/80"
                  >
                    {highlight}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                <div className="text-sm font-semibold text-slate-900">
                  Public checkout note
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  FULL is intentionally hidden from public checkout and remains
                  internal/admin only.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            <PaymentCard
              title="Paystack"
              subtitle="Future primary payment partner for KeepSave premium upgrades."
              badge="Primary Partner"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] text-lg font-semibold text-slate-700 ring-1 ring-[#e5d8bb] shadow-sm">
                Paystack
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                This will be the first payment method activated once live billing
                is connected to your account.
              </p>

              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] py-3.5 font-medium text-slate-700 opacity-75"
              >
                Paystack coming soon
              </button>
            </PaymentCard>

            <PaymentCard
              title="Apple Pay"
              subtitle="Fast checkout for supported Apple devices and browsers."
              badge="Coming Soon"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-black text-lg font-semibold text-white shadow-sm">
                 Pay
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Visible as a premium placeholder and planned for a later rollout.
              </p>

              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-black/70 py-3.5 font-medium text-white/80 opacity-70"
              >
                Apple Pay coming soon
              </button>
            </PaymentCard>

            <PaymentCard
              title="Google Pay"
              subtitle="Quick checkout for supported Android and Chrome users."
              badge="Coming Soon"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-800 ring-1 ring-slate-200 shadow-sm">
                Google Pay
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Visible as a premium placeholder and planned for a later rollout.
              </p>

              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-[#dce8f6]/80 py-3.5 font-medium text-[#6d87ad]/80 opacity-70"
              >
                Google Pay coming soon
              </button>
            </PaymentCard>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/70 bg-white/55 p-5 text-center shadow-sm backdrop-blur-md">
            <div className="text-sm font-semibold text-slate-900">
              Launch note
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Billing is not live yet. This page is a premium pre-launch checkout
              preview showing public plan pricing, add-on structure, and the
              payment methods planned for activation.
            </p>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Need to compare plans again?
            </p>
            <Link
              href="/#pricing"
              className="mt-3 inline-flex items-center justify-center rounded-2xl bg-white/50 px-5 py-3 text-sm font-medium text-slate-700 ring-1 ring-white/70 shadow-sm backdrop-blur transition hover:bg-white/70"
            >
              Back to Pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
