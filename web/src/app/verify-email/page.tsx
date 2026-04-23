import { Suspense } from "react";
import VerifyEmailPageClient from "./page-client";

function VerifyEmailPageFallback() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.35),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:grid-cols-2">
          <section className="hidden flex-col justify-between bg-gradient-to-br from-[#edf4f1] via-[#f6faf8] to-[#eef3fb] p-10 md:flex">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                KeepSave
              </div>

              <h1 className="mt-8 text-4xl font-semibold leading-tight text-slate-900">
                One last step. Verify your email.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Luma is ready. We just need to confirm your email address before
                you can log in and continue your will.
              </p>
            </div>

            <div className="mt-10 flex items-end gap-6">
              <div className="mb-6 rounded-3xl bg-white/80 p-5 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-white/80">
                <div className="font-semibold text-slate-900">
                  I’ve sent your next step.
                </div>
                <div className="mt-2">
                  Open your inbox, click the link, and then come back to log in.
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Verify Your Email
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Loading verification details...
                </p>
              </div>

              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageFallback />}>
      <VerifyEmailPageClient />
    </Suspense>
  );
}
