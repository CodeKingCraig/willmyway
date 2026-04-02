import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDraftStateByUserId } from "@/lib/draft";
import Step6FinalReview from "./step6-final-review";

export default async function WillStep6Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draftState = await getDraftStateByUserId(user.id);

  if (!draftState.exists) {
    redirect("/will/start");
  }

  const isLocked = draftState.status === "LOCKED";

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step 6 of 6
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Final Review
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Review your will, add your witnesses, and lock it when you are satisfied.
                You can unlock it later if you need to make changes.
              </p>

              <div className="mt-6 rounded-3xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Why this step matters
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      This is your final checkpoint. Confirm the people, assets, distributions, and witness details before locking your will.
                    </div>
                  </div>

                  <div className="inline-flex h-fit items-center rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#6d87ad]">
                    Final confirmation
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
                <Step6FinalReview />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {!isLocked ? (
                  <Link
                    href="/will/step/5"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ← Back to Step 5
                  </Link>
                ) : (
                  <div />
                )}

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  Back to Dashboard →
                </Link>
              </div>
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[30px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  Luma Guide
                </div>

                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  Let’s make sure everything is ready.
                </h2>

                <p className="mt-3 text-sm text-slate-600">
                  Review your summary carefully, add two witnesses, and lock your will once you are confident it reflects your wishes.
                </p>

                <div className="mt-5 flex justify-center">
                  <video
                    src="/luma-step-6-final-review.webm"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full max-w-[220px] object-contain"
                  />
                </div>

                <div className="mt-4 rounded-3xl bg-white/90 p-4 text-sm text-slate-600 shadow ring-1 ring-white/80">
                  <div className="font-semibold text-slate-900">
                    Step 6 checklist
                  </div>
                  <ul className="mt-2 space-y-1">
                    <li>• Review executors, beneficiaries, and assets</li>
                    <li>• Confirm each asset distribution totals 100%</li>
                    <li>• Add 2 witness names</li>
                    <li>• Tick confirmation before locking</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-3xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                  <div className="font-semibold text-slate-900">
                    Tip
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Lock only when you are comfortable with the summary. You can still unlock later to make edits.
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