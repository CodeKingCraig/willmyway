import Link from "next/link";

export default function IntellectualPropertyPage() {
  return (
    <main className="wmw-page">
      <div className="wmw-bg-image" />
      <div className="wmw-overlay" />

      <div className="wmw-content">
        <section className="mx-auto max-w-4xl px-6 py-16 text-sm leading-7 text-slate-700">

          {/* Back to Home */}
          <Link
            href="/"
            className="mb-8 inline-flex rounded-2xl bg-white/55 px-5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-white/70 backdrop-blur-md transition hover:bg-white/75 hover:text-slate-900"
          >
            ← Back to Home
          </Link>

          <h1 className="mb-6 text-3xl font-bold text-slate-800">
            Intellectual Property Notice
          </h1>

          <p className="mb-6">
            All content, design elements, platform structure, wording, workflows,
            features, layouts, graphics, branding, names, logos, and proprietary
            materials on this website and platform are protected by intellectual
            property rights and may not be copied, reproduced, adapted, reverse
            engineered, scraped, distributed, sold, licensed, or exploited
            without prior written permission.
          </p>

          <p className="mb-6">
            Use of this platform or any part of it for the purpose of creating,
            informing, benchmarking, or developing a competing product or service
            is strictly prohibited.
          </p>

          <h2 className="mt-8 mb-2 font-semibold">
            Implementation Notes for Developer
          </h2>

          <ul className="ml-6 list-disc space-y-2">

            <li>
              Publish Terms and Conditions and Privacy Policy as separate pages
              linked in the site footer.
            </li>

            <li>
              Place the Short Disclaimer in the will-creation flow, signup flow,
              and any page where users may interpret content as legal advice.
            </li>

            <li>
              Use the Footer Version in the global footer or near primary calls
              to action.
            </li>

            <li>
              Keep the website URL, company name, and contact information exactly
              consistent across all pages.
            </li>

            <li>
              Do not remove headings such as &quot;No Legal, Financial, Tax,
              Fiduciary, or Professional Advice&quot; without approval.
            </li>

          </ul>

        </section>
      </div>
    </main>
  );
}