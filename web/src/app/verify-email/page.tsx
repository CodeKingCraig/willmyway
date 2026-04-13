"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type ApiError = {
  error?: string;
  message?: string;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as ApiError;
  return p.error || p.message || fallback;
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const emailSent = searchParams.get("emailSent") === "1";

  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleResendVerification() {
    if (!email.trim()) {
      setError("Missing email address.");
      return;
    }

    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          getErrorMessage(payload, "Could not resend verification email.")
        );
        setResendLoading(false);
        return;
      }

      setSuccess("Verification email sent. Check your inbox.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.35),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:grid-cols-2">
          <section className="hidden flex-col justify-between bg-gradient-to-br from-[#edf4f1] via-[#f6faf8] to-[#eef3fb] p-10 md:flex">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                WillMyWay
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
              <div className="relative h-[220px] w-[180px] shrink-0">
                <Image
                  src="/luma.png"
                  alt="Luma"
                  fill
                  className="object-contain drop-shadow-[0_18px_35px_rgba(108,140,132,0.22)]"
                  priority
                />
              </div>

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
              <div className="mb-6 flex flex-col items-center text-center md:hidden">
                <div className="relative h-28 w-24">
                  <Image
                    src="/luma.png"
                    alt="Luma"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                <div className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  WillMyWay
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Verify Your Email
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We created your account. Now confirm your email to activate
                  it.
                </p>
              </div>

              {email ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <span className="font-medium">Email:</span> {email}
                </div>
              ) : null}

              <div
                className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                  emailSent
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {emailSent
                  ? "Verification email sent. Check your inbox and click the verification link."
                  : "Your account was created, but the verification email could not be sent automatically. Use the button below to resend it."}
              </div>

              {error ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading || !email}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:opacity-60"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>

                <Link
                  href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go to Login
                </Link>

                <Link
                  href="/"
                  className="text-center text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}