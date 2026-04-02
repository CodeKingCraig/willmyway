import Link from "next/link";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="wmw-social group animate-[wmwFadeIn_0.8s_ease-out_both] rounded-full bg-white/35 p-3 shadow-[0_8px_24px_rgba(148,163,184,0.12)] ring-1 ring-white/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/55 hover:shadow-[0_12px_30px_rgba(148,163,184,0.22)]"
    >
      <span className="wmw-sparkle wmw-sparkle-1">✦</span>
      <span className="wmw-sparkle wmw-sparkle-2">✦</span>
      <span className="wmw-sparkle wmw-sparkle-3">✦</span>

      <span className="relative z-10">{children}</span>
    </a>
  );
}

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
              <img
                src="/luma.png"
                alt="Luma"
                className="h-6 w-6 object-contain"
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
              Get Started
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

        <section className="mx-auto max-w-5xl px-6 pb-8 pt-14">
          <div className="wmw-glass rounded-[30px] px-8 py-10 text-center">
            <div className="text-[1.9rem] font-semibold text-slate-700">
              No Paperwork Chaos
            </div>
            <p className="mx-auto mt-4 max-w-4xl text-lg text-slate-600 md:text-[1.35rem]">
              Start your will online. Store everything securely. Eliminate the
              paperwork mess.
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
            <div className="wmw-glass rounded-[30px] p-8">
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

            <div className="wmw-glass rounded-[30px] p-8">
              <div className="inline-flex rounded-full bg-[#dce8f6]/80 px-3 py-1 text-sm font-medium text-[#7b95bb] ring-1 ring-white/70">
                Step 2
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Review &amp; lock your will
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
                  Get Started
                </Link>
              </div>
            </div>

            <div className="wmw-glass rounded-[30px] p-8">
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

        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20 pt-4">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
              Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600 md:text-[1.2rem]">
              Choose the kind of legacy you want to leave behind.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="wmw-glass rounded-[30px] p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-semibold text-slate-800">
                    Essential
                  </h3>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Free
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-white/60 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Build your will</CheckItem>
                  <CheckItem>Store your will securely</CheckItem>
                  <CheckItem>Update anytime</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#dce8f6] py-3.5 font-medium text-[#6d87ad] transition hover:bg-[#d5e2f2]"
              >
                Start Free
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-[#efe1bd] bg-white/65 p-8 shadow-[0_18px_50px_rgba(229,216,187,0.18)] backdrop-blur-md">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#efe5cf] via-[#f4ead8] to-[#efe5cf]" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-[#efe5cf] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                    Most Loved
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold text-slate-800">
                    Legacy
                  </h3>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Paid Plan
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-white/70 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Everything in Essential</CheckItem>
                  <CheckItem>Build your will</CheckItem>
                  <CheckItem>Store your will securely</CheckItem>
                  <CheckItem>Update anytime</CheckItem>
                  <CheckItem>Write personal letters</CheckItem>
                  <CheckItem>Leave final notes for loved ones</CheckItem>
                </ul>
              </div>

              <Link
                href="/checkout"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#efe5cf] py-3.5 font-medium text-slate-700 transition hover:bg-[#eadfca]"
              >
                Checkout
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/58 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f3e8d2]/25 to-transparent" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-semibold text-slate-800">
                      Legacy+
                    </h3>
                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                      Premium
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/70 pt-6">
                  <ul className="space-y-4 text-left">
                    <CheckItem>Everything in Legacy</CheckItem>
                    <CheckItem>Build your will</CheckItem>
                    <CheckItem>Store your will securely</CheckItem>
                    <CheckItem>Update anytime</CheckItem>
                    <CheckItem>Letters and personal notes</CheckItem>
                    <CheckItem>Upload private video messages</CheckItem>
                    <CheckItem>Assign videos to specific loved ones</CheckItem>
                  </ul>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] py-3.5 font-medium text-slate-700 transition hover:shadow-md"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="flex justify-center gap-5">
            <SocialIcon href="#" label="Facebook">
              <svg
                className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:text-[#7b95bb]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H16.8V5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.3 1.5-4.3 4.4V11H7v3h3v8h3.5Z" />
              </svg>
            </SocialIcon>

            <SocialIcon href="#" label="Instagram">
              <svg
                className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:text-[#7b95bb]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </SocialIcon>

            <SocialIcon href="#" label="LinkedIn">
              <svg
                className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:text-[#7b95bb]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.75h2.88V18H5.5V9.75Zm4.69 0h2.76v1.13h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V18h-2.88v-3.72c0-.89-.02-2.03-1.24-2.03-1.24 0-1.43.97-1.43 1.97V18h-2.88V9.75Z" />
              </svg>
            </SocialIcon>
          </div>
        </section>
      </div>
    </main>
  );
}