import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Step5DistributionsForm from "./step5-distributions-form";

export default async function WillStep5Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) {
  redirect("/onboarding");
}

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">

            {/* LEFT */}
            <div className="rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step 5 of 6
              </div>

              <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Distributions
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Decide who gets what. Each asset must total <span className="font-semibold">100%</span>.
              </p>

              {/* WHY */}
              <div className="mt-6 rounded-3xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Why this step matters
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      This is where your will becomes actionable. Each asset must be fully allocated to avoid disputes.
                    </div>
                  </div>

                  <div className="inline-flex h-fit items-center rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#6d87ad]">
                    Allocate clearly
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
                <Step5DistributionsForm />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Link
                  href="/will/step/4"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ← Back to Step 4
                </Link>

                <Link
                  href="/will/step/6"
                  className="rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5"
                >
                  Go to Review →
                </Link>
              </div>
            </div>

            {/* RIGHT - LUMA */}
            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[30px] border border-white/70 bg-white/70 p-5 shadow backdrop-blur-xl">

                <div className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Luma Guide
                </div>

                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  Let’s split things fairly.
                </h2>

                <p className="mt-3 text-sm text-slate-600">
                  Allocate each asset across your beneficiaries. Make sure every asset totals 100%.
                </p>

                <div className="mt-5 flex justify-center">
                  <video
                    src="/luma-step-5-distributions.webm"
                    autoPlay
                    muted
                    loop
                    className="max-w-[220px]"
                  />
                </div>

                <div className="mt-4 rounded-3xl bg-white/90 p-4 text-sm">
                  <div className="font-semibold">Checklist</div>
                  <ul className="mt-2 space-y-1">
                    <li>• Every asset has allocations</li>
                    <li>• Totals = 100%</li>
                    <li>• No duplicate beneficiaries</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-3xl bg-[#fffaf1] p-4">
                  <div className="font-semibold">Tip</div>
                  <div className="mt-2 text-sm">
                    If unsure, start with equal splits and adjust later.
                  </div>
                </div>

              </div>
            </aside>

          </div>
        </div>
      </section>
    </main>
  );
}