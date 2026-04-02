import Link from "next/link";

function PaymentCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wmw-glass rounded-[30px] p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>

        <span className="rounded-full bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-white/70">
          {badge}
        </span>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}

export default function CheckoutPage() {
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
              href="/"
              className="rounded-2xl bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white/80"
            >
              Back
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-[#efe5cf] px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-[#eadfca] shadow-sm transition hover:bg-[#eadfca]"
            >
              Create Account
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-6 pb-8 pt-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-800 md:text-6xl">
            Checkout
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-[1.2rem]">
            Choose a payment method for your WillMyWay plan. This page is a
            placeholder flow for now and can be connected to live payments next.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            <PaymentCard
              title="Apple Pay"
              subtitle="Fast checkout for supported Apple devices and browsers."
              badge="Placeholder"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-black text-lg font-semibold text-white shadow-sm">
                 Pay
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Placeholder only. Live Apple Pay will require gateway setup and
                compatible device support.
              </p>

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-black py-3.5 font-medium text-white transition hover:opacity-90"
              >
                Continue with Apple Pay
              </button>
            </PaymentCard>

            <PaymentCard
              title="Google Pay"
              subtitle="Quick checkout for supported Android and Chrome users."
              badge="Placeholder"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-800 ring-1 ring-slate-200 shadow-sm">
                Google Pay
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Placeholder only. Live Google Pay will require real payment
                gateway configuration.
              </p>

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#dce8f6] py-3.5 font-medium text-[#6d87ad] transition hover:bg-[#d5e2f2]"
              >
                Continue with Google Pay
              </button>
            </PaymentCard>

            <PaymentCard
              title="Paystack"
              subtitle="Best path for your future live payment integration."
              badge="Recommended"
            >
              <div className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] text-lg font-semibold text-slate-700 ring-1 ring-[#e5d8bb] shadow-sm">
                Paystack
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Placeholder for now. This is the easiest option to turn into a
                real live checkout later.
              </p>

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f3e8d2] to-[#e8dcc4] py-3.5 font-medium text-slate-700 transition hover:shadow-md"
              >
                Continue with Paystack
              </button>
            </PaymentCard>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Need to compare plans again?
            </p>
            <Link
              href="/#pricing"
              className="mt-3 inline-flex items-center justify-center rounded-2xl bg-white/50 px-5 py-3 text-sm font-medium text-slate-700 ring-1 ring-white/70 shadow-sm backdrop-blur transition hover:bg-white/70"
            >
              Back to Pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}