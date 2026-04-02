"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Login failed.");
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.35),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:grid-cols-2">
          
          {/* LEFT PANEL */}
          <section className="hidden md:flex flex-col justify-between bg-gradient-to-br from-[#edf4f1] via-[#f6faf8] to-[#eef3fb] p-10">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d8e4de] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                WillMyWay
              </div>

              <h1 className="mt-8 text-4xl font-semibold leading-tight text-slate-900">
                Welcome back to your calm, guided will journey.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Continue your planning with clarity, care, and a little help
                from Luma.
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
                <div className="font-semibold text-slate-900">Hi, I’m Luma.</div>
                <div className="mt-2">
                  I’ll be right here while you log in and continue building your
                  will.
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
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
                  Login
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter your details to continue to your dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#7b95bb]"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-2xl bg-[#7b95bb] px-4 py-3 text-white font-semibold"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* ACTION LINKS */}
              <div className="mt-6 text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-[#6d87ad]">
                  Register
                </Link>
              </div>

              {/* NEW BACK BUTTON */}
              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-slate-500 hover:text-slate-900 transition"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f8fb]" />}>
      <LoginPageContent />
    </Suspense>
  );
}