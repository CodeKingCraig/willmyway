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
 <header className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
  <Link href="/" className="flex items-center shrink-0">
    <Image
      src="/keepsave-logo-horizontal.png"
      alt="KeepSave"
      width={760}
      height={210}
      priority
      className="h-44 w-auto object-contain"
    />
  </Link>

  <div className="flex items-center gap-4">
    <Link
      href="/login"
      className="rounded-2xl bg-white/70 px-6 py-3 text-base font-medium text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white/80"
    >
      Log In
    </Link>

    <Link
      href="/register"
      className="rounded-2xl bg-[#efe5cf] px-7 py-3 text-base font-medium text-slate-700 ring-1 ring-[#eadfca] shadow-sm transition hover:bg-[#eadfca]"
    >
      Create My Will
    </Link>
  </div>
</header>

        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-12 text-center md:pt-20">
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-[#7b95bb] md:text-7xl">
            All your grown-up stuff. Finally in one place.
            <br />
            Because “I’ll do it later” is not a life plan.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-[1.45rem]">
            Create your free will with no strings attached and none of the 3.5%
            fees on your hard-earned money. Luma helps organise important
            documents, store the details your family may need, and preserve the
            meaningful things too — without messy paperwork.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] px-8 py-4 text-lg font-medium text-slate-700 ring-1 ring-[#e5d8bb] shadow-[0_6px_20px_rgba(229,216,187,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(229,216,187,0.65)]"
            >
              Get Started →
            </Link>

            <a
              href="#how"
              className="group inline-flex items-center justify-center rounded-2xl bg-white/40 px-8 py-4 text-lg font-medium text-[#7b95bb] ring-1 ring-white/60 shadow-[0_4px_20px_rgba(148,163,184,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-[0_8px_30px_rgba(148,163,184,0.35)]"
            >
              See How It Works →
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
          <div className="grid items-center gap-8 rounded-[36px] border border-white/60 bg-white/55 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.18)] ring-1 ring-white/70 backdrop-blur-md md:grid-cols-[0.9fr_1.1fr] md:p-12">
            <div className="flex justify-center">
              <div className="flex h-[300px] w-[300px] flex-col items-center justify-center rounded-[32px] bg-white/55 p-8 text-center shadow-[0_10px_40px_rgba(148,163,184,0.20)] ring-1 ring-white/70 backdrop-blur-md">
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
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b95bb]">
                What This Is
              </p>

              <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-800 md:text-6xl">
                More than a will.
                <br />
                Much less messy.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Safe, simple, and surprisingly satisfying. This is your digital
                home for the things people usually avoid until life gets messy —
                or until you need them while standing in a queue at the bank,
                buying a car, or searching for documents you can’t find.
              </p>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Luma saves it all for you: your will, important documents,
                passwords, policies, wishes, notes, and the little things your
                family may one day wish they had.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20 pt-14">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
              Pricing
            </h2>

            <p className="mt-4 text-lg text-slate-600 md:text-[1.2rem]">
              Start free. Get organised once. Stay ready for life changes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <h3 className="text-3xl font-semibold text-slate-800">
                Just in Case Free Will
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Free
              </p>

              <p className="mt-4 text-base leading-7 text-slate-600">
                For getting the essential grown-up stuff started.
              </p>

              <div className="mt-8 border-t border-white/60 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Create your will</CheckItem>
                  <CheckItem>Easy guided setup</CheckItem>
                  <CheckItem>Secure account access</CheckItem>
                  <CheckItem>Upgrade anytime</CheckItem>
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

              <div className="inline-flex rounded-full bg-[#efe5cf] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Best Value
              </div>

              <h3 className="mt-4 text-3xl font-semibold text-slate-800">
                One Place
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                R349 Once-Off
              </p>

              <p className="mt-4 text-base leading-7 text-slate-600">
                For keeping the important stuff together, properly.
              </p>

              <div className="mt-8 border-t border-white/70 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Everything in Just in Case</CheckItem>
                  <CheckItem>Guided will setup</CheckItem>
                  <CheckItem>Beneficiaries and executor details</CheckItem>
                  <CheckItem>Download your completed will</CheckItem>
                  <CheckItem>Store key life documents</CheckItem>
                  <CheckItem>Keep important information in one place</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#efe5cf] py-3.5 font-medium text-slate-700 transition hover:bg-[#eadfca]"
              >
                Get Organised
              </Link>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <h3 className="text-3xl font-semibold text-slate-800">
                Leave Love
              </h3>

              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                R699 Once-Off
              </p>

              <p className="mt-4 text-base leading-7 text-slate-600">
                For the things that matter on paper and beyond it.
              </p>

              <div className="mt-8 border-t border-white/60 pt-6">
                <ul className="space-y-4 text-left">
                  <CheckItem>Everything in One Place</CheckItem>
                  <CheckItem>Legacy letters</CheckItem>
                  <CheckItem>Video messages</CheckItem>
                  <CheckItem>Family document vault</CheckItem>
                  <CheckItem>Funeral and personal wishes</CheckItem>
                  <CheckItem>Space for meaningful extras</CheckItem>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#dce8f6] py-3.5 font-medium text-[#6d87ad] transition hover:bg-[#d5e2f2]"
              >
                Build My Legacy
              </Link>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-[#dce8f6] bg-white/60 shadow-[0_16px_50px_rgba(123,149,187,0.18)] ring-1 ring-white/70 backdrop-blur-md">
            <div className="h-1.5 bg-gradient-to-r from-[#7b95bb] via-[#dce8f6] to-[#efe5cf]" />

            <div className="p-8">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex rounded-full bg-[#dce8f6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6d87ad]">
                    Optional Monthly Plan
                  </div>

                  <h3 className="mt-4 text-4xl font-semibold text-slate-800">
                    Circle of Life
                  </h3>

                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    R49 / Month
                  </p>

                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    For the things that change with life — and should never be
                    left outdated, lost, or forgotten.
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#f8fafc]/80 p-4 text-sm leading-6 text-slate-600 ring-1 ring-white/70">
                    <span className="font-semibold text-slate-800">
                      When life changes, your plan changes too.
                    </span>{" "}
                    Keep your documents, people, wishes, and family instructions
                    current without starting from scratch.
                  </div>
                </div>

                <div className="w-full max-w-md">
                  <ul className="space-y-4 text-left">
                    <CheckItem>Annual will review prompts</CheckItem>
                    <CheckItem>Secure family vault with cloud backup</CheckItem>
                    <CheckItem>Update beneficiaries anytime</CheckItem>
                    <CheckItem>Store passwords, policies and key contacts</CheckItem>
                    <CheckItem>Legacy video and memory storage</CheckItem>
                    <CheckItem>Emergency family access instructions</CheckItem>
                    <CheckItem>Priority support when needed</CheckItem>
                    <CheckItem>Ongoing document organisation tools</CheckItem>
                  </ul>

                  <Link
                    href="/register"
                    className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] py-3.5 font-medium text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                  >
                    Add Circle of Life
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
              How It Works
            </h2>

            <p className="mt-4 text-lg text-slate-600 md:text-[1.2rem]">
              Three simple options. A lot less messy.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-[#f3e8d2]/80 px-3 py-1 text-sm font-medium text-[#b69754] ring-1 ring-[#eadfca]">
                Option 1
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Start with the essentials
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Answer a few guided questions to create your free will — no
                strings attached — and get the important basics in place.
              </p>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-[#dce8f6]/80 px-3 py-1 text-sm font-medium text-[#7b95bb] ring-1 ring-white/70">
                Option 2
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Pull life together
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Add key documents, personal details, and the practical
                information your family may one day need. Always in one place.
                Never hunt for your important grown-up stuff again.
              </p>
            </div>

            <div className="rounded-[30px] bg-white/45 p-8 shadow-[0_12px_40px_rgba(148,163,184,0.14)] ring-1 ring-white/70 backdrop-blur-md">
              <div className="inline-flex rounded-full bg-white/50 px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-white/70">
                Option 3
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-slate-800">
                Leave the good stuff too
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Store wishes, letters, videos, and meaningful extras so the
                admin is handled — and the heart is too. Create messages for the
                people you love.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}