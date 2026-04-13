import Image from "next/image";
import Link from "next/link";

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-slate-600">
      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#7c63d6]" />
      <span>{children}</span>
    </li>
  );
}

export default function HomePage() {
  return (
    <main className="wmw-page">
      <div className="wmw-bg-image" />
      <div className="wmw-overlay" />

      <div className="wmw-content">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60 ring-1 ring-white/70 shadow-sm backdrop-blur">
              <Image
                src="/luma.png"
                alt="Luma"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
                priority
              />
            </div>

            <div className="text-2xl font-semibold tracking-tight">
              WillMyWay
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white/80"
            >
              Log In
            </Link>

            <Link
              href="/register"
              className="rounded-2xl bg-[#efe5cf] px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-[#eadfca] shadow-sm transition hover:bg-[#eadfca]"
            >
              Create My Will
            </Link>
          </div>
        </header>

        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-12 text-center md:pt-20">
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-[#7b95bb] md:text-7xl">
            Your Will. Your Way.
            <br />
            Zero Confusion.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-[1.45rem]">
            Create, update, and control your will digitally — with clarity,
            security, and total authority.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] px-8 py-4 text-lg font-medium text-slate-700 ring-1 ring-[#e5d8bb] shadow-[0_6px_20px_rgba(229,216,187,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(229,216,187,0.65)]"
            >
              Create My Will →
            </Link>

            <a
              href="#how"
              className="group inline-flex items-center justify-center rounded-2xl bg-white/40 px-8 py-4 text-lg font-medium text-[#7b95bb] ring-1 ring-white/60 shadow-[0_4px_20px_rgba(148,163,184,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-[0_8px_30px_rgba(148,163,184,0.35)]"
            >
              See How It Works →
            </a>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20 pt-14">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
              Pricing
            </h2>

            <p className="mt-4 text-lg text-slate-600 md:text-[1.2rem]">
              One-time will plans with optional monthly family protection.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <h3 className="text-3xl font-semibold text-slate-800">
                Essential
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Free
              </p>

              <div className="mt-8 border-t border-white/60 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Create your will</CheckItem>
                  <CheckItem>Guided step-by-step flow</CheckItem>
                  <CheckItem>Secure account access</CheckItem>
                  <CheckItem>Upgrade anytime</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#dce8f6] py-3.5 font-medium text-[#6d87ad] transition hover:bg-[#d5e2f2]"
              >
                Get Started Free
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-[#efe1bd] bg-white/65 p-8 shadow-[0_18px_50px_rgba(229,216,187,0.18)] backdrop-blur-md">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#efe5cf] via-[#f4ead8] to-[#efe5cf]" />

              <div className="inline-flex rounded-full bg-[#efe5cf] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Most Popular
              </div>

              <h3 className="mt-4 text-3xl font-semibold text-slate-800">
                Legacy
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                R349 Once-Off
              </p>

              <div className="mt-8 border-t border-white/70 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Everything in Essential</CheckItem>
                  <CheckItem>Full guided legal will flow</CheckItem>
                  <CheckItem>Beneficiaries & executors</CheckItem>
                  <CheckItem>Download final will</CheckItem>
                  <CheckItem>Priority support</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#efe5cf] py-3.5 font-medium text-slate-700 transition hover:bg-[#eadfca]"
              >
                Create My Will
              </Link>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <h3 className="text-3xl font-semibold text-slate-800">
                Family Vault
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                R699 Once-Off
              </p>

              <div className="mt-8 border-t border-white/60 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Everything in Legacy</CheckItem>
                  <CheckItem>Legacy letters</CheckItem>
                  <CheckItem>Video messages</CheckItem>
                  <CheckItem>Family document vault</CheckItem>
                  <CheckItem>Premium planning tools</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#dce8f6] py-3.5 font-medium text-[#6d87ad] transition hover:bg-[#d5e2f2]"
              >
                Protect My Family
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-[#dce8f6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6d87ad]">
                  Optional Monthly Plan
                </div>

                <h3 className="mt-4 text-3xl font-semibold text-slate-800">
                  WillMyWay Care
                </h3>

                <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  R49 / Month
                </p>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  Ongoing protection, secure cloud vault, annual reviews and
                  legacy support.
                </p>
              </div>

              <div className="w-full max-w-md">
                <ul className="space-y-4 text-left">
                  <CheckItem>Annual will review reminders</CheckItem>
                  <CheckItem>Secure document cloud vault</CheckItem>
                  <CheckItem>Legacy video storage</CheckItem>
                  <CheckItem>Family access tools</CheckItem>
                  <CheckItem>Priority updates & support</CheckItem>
                </ul>

                <Link
                  href="/register"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] py-3.5 font-medium text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  Add Care Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20 pt-2">
          <div className="mx-auto flex h-[320px] w-[320px] flex-col items-center justify-center rounded-[32px] bg-white/40 p-8 text-center shadow-[0_10px_40px_rgba(148,163,184,0.20)] ring-1 ring-white/70 backdrop-blur-md">
            <div className="relative mb-6 h-24 w-24">
              <Image
                src="/luma.png"
                alt="Luma"
                fill
                className="object-contain"
                priority
              />
            </div>

            <h2 className="text-3xl font-semibold text-slate-800">
              No Paperwork Chaos
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Powered by Luma
            </p>

            <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
              Start your will online. Store everything securely.
            </p>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
              See How It Works
            </h2>

            <p className="mt-4 text-lg text-slate-600 md:text-[1.2rem]">
              Three calm steps. One clear legacy.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-[#f3e8d2]/80 px-3 py-1 text-sm font-medium text-[#b69754] ring-1 ring-[#eadfca]">
                Step 1
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Answer guided questions
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Follow a simple flow that helps you complete your will with
                clarity and confidence.
              </p>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-[#dce8f6]/80 px-3 py-1 text-sm font-medium text-[#7b95bb] ring-1 ring-white/70">
                Step 2
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Review & lock your will
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Check everything carefully, confirm your wishes, and keep your
                final record secure.
              </p>

              <div className="mt-6">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#c8d9ef] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#bfd1ea]"
                >
                  Create My Will
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-white/50 px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-white/70">
                Step 3
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Update anytime
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Life changes. Your will can change with it whenever you need to
                adjust your record.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}