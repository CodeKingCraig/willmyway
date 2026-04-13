import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LegacyClient from "./legacy-client";

export default async function LegacyPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const allowedPlans = ["LEGACY", "FAMILY_VAULT", "FULL"];

  const hasLegacyAccess = allowedPlans.includes(user.basePlan);

  if (!hasLegacyAccess) {
    redirect("/dashboard?upgrade=legacy");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Protected legacy space
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Legacy Space
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Legacy
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                A private place for letters, personal wishes, and meaningful
                video messages for the people you leave behind.
              </p>

              <div className="mt-6 rounded-3xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Why this space matters
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Your will handles the legal side. Legacy is where your
                      voice, wishes, and personal guidance can live in a more
                      human way.
                    </div>
                  </div>

                  <div className="inline-flex h-fit items-center rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#6d87ad]">
                    Private memory vault
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
                <LegacyClient />
              </div>
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[30px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  Luma Guide
                </div>

                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  Let’s preserve the personal side too.
                </h2>

                <p className="mt-3 text-sm text-slate-600">
                  Use this space for messages, memories, and practical wishes
                  your loved ones may need one day.
                </p>

                <div className="mt-5 flex justify-center">
                  <img
                    src="/luma.png"
                    alt="Luma"
                    className="w-full max-w-[160px] object-contain"
                  />
                </div>

                <div className="mt-4 rounded-3xl bg-white/90 p-4 text-sm text-slate-600 shadow ring-1 ring-white/80">
                  <div className="font-semibold text-slate-900">
                    Legacy checklist
                  </div>
                  <ul className="mt-2 space-y-1">
                    <li>• Write personal letters</li>
                    <li>• Add up to 5 private videos</li>
                    <li>• Capture funeral preferences</li>
                    <li>• Keep everything calm and clear</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-3xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                  <div className="font-semibold text-slate-900">Tip</div>
                  <div className="mt-2 text-sm text-slate-600">
                    The most meaningful legacy messages are usually simple,
                    honest, and personal.
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