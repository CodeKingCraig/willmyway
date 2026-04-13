import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import OnboardingInsightForm from "./onboarding-insight-form";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="rounded-[34px] border border-white/70 bg-white/70 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.10)] backdrop-blur-md sm:p-10">
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Premium onboarding
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Before we begin, let’s personalise your WillMyWay journey.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                These five quick questions help us shape a calmer, more relevant
                experience for you — from your will flow to future legacy tools,
                secure storage, and family support features.
              </p>

              <div className="mt-8 rounded-3xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fbff] to-[#f8f6f2] p-5">
                <div className="text-sm font-semibold text-slate-900">
                  Why we ask this
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Estate planning is emotional as well as practical. Your answers
                  help us understand what matters most to you, so we can guide you
                  with more clarity, relevance, and care.
                </div>
              </div>

              <div className="mt-8">
                <OnboardingInsightForm />
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-[34px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.10)] backdrop-blur-md">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  A thoughtful start
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                  This takes less than a minute.
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Once completed, you’ll move straight into Step 1 of your will.
                  You’ll only see this once.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-white/80">
                    <div className="text-sm font-semibold text-slate-900">
                      Helps us personalise
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      We can better support needs like family planning, secure
                      storage, legacy letters, and practical guidance.
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
                    <div className="text-sm font-semibold text-slate-900">
                      Elegant and private
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      Your answers are stored privately in your account and used
                      to improve your premium experience.
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#f4fbf7] p-4 ring-1 ring-[#dfeee6]">
                    <div className="text-sm font-semibold text-slate-900">
                      What comes next
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      After this, you’ll continue into your will builder starting
                      at Step 1: Personal Details.
                    </div>
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