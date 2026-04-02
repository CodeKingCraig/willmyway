import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDraftStateByUserId } from "@/lib/draft";
import StartWizardButton from "./start-wizard-button";

export default async function WillStartPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draftState = await getDraftStateByUserId(user.id);

  if (draftState.exists) {
    redirect(`/will/step/${draftState.step}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-b from-[#0b3a78] to-[#2b6cb0]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-semibold tracking-tight text-white">
            WillMyWay
          </div>

          <nav className="flex items-center gap-8 text-sm font-medium text-white/85">
            <Link href="/dashboard" className="pb-2 hover:text-white">
              Dashboard
            </Link>
            <Link
              href="/will/start"
              className="border-b-2 border-white pb-2 text-white"
            >
              My Will
            </Link>
            <span className="cursor-default pb-2 hover:text-white">Legacy</span>
            <span className="cursor-default pb-2 hover:text-white">Access</span>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-800">Wizard Start</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start the wizard to create your first draft. Your progress saves as you go.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-800">
            Ready to begin?
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Click start to create your draft and enter step 1.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <StartWizardButton />

            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}