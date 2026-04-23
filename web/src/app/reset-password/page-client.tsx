"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 102.83 2.83" />
        <path d="M9.88 4.24A10.94 10.94 0 0112 4c5.05 0 9.27 3.11 10.5 8a10.96 10.96 0 01-4.04 5.94" />
        <path d="M6.61 6.61A10.95 10.95 0 001.5 12c1.23 4.89 5.45 8 10.5 8 1.68 0 3.28-.35 4.73-.98" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M1.5 12S5.73 4 12 4s10.5 8 10.5 8-4.23 8-10.5 8S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErrorMessage(payload, "Could not reset password."));
        setLoading(false);
        return;
      }

      router.push("/login?reset=1");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
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
                KeepSave
              </div>

              <h1 className="mt-8 text-4xl font-semibold leading-tight text-slate-900">
                Set a new password.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Choose a new password to regain secure access to your account.
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
                <div className="font-semibold text-slate-900">Almost there.</div>
                <div className="mt-2">
                  Set your new password and head back to login.
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
                  KeepSave
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Reset Password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Reset Password"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                <Link
                  href="/login"
                  className="font-semibold text-[#6d87ad] underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
