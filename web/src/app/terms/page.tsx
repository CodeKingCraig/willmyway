import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="wmw-page">
      <div className="wmw-bg-image" />
      <div className="wmw-overlay" />

      <div className="wmw-content">
        <section className="mx-auto max-w-4xl px-6 py-16 text-sm leading-7 text-slate-700">

          {/* Back */}
          <Link
            href="/"
            className="mb-8 inline-flex rounded-2xl bg-white/55 px-5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-white/70 backdrop-blur-md transition hover:bg-white/75 hover:text-slate-900"
          >
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold mb-6 text-slate-800">
            KEEP SAVE TERMS AND CONDITIONS
          </h1>

          <p className="mb-6">
            <strong>Information Officer</strong> Berne de Klerk<br />
            <strong>Website / Platform Owner:</strong> KeepSave<br />
            <strong>Website:</strong> https://www.keepsave.co.za
          </p>

          <h2 className="font-semibold mt-6 mb-2">1. Introduction</h2>
          <p className="mb-4">
            Welcome to KeepSave. These Terms and Conditions govern your access to and use of our website, platform, services, content, tools, templates, and features.
          </p>
          <p className="mb-4">
            By accessing or using our website or platform, you agree to these Terms and Conditions. If you do not agree, please do not use the website or platform.
          </p>

          <h2 className="font-semibold mt-6 mb-2">2. About Us</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>secure digital storage;</li>
            <li>personal organisation and life admin;</li>
            <li>creating a free will template or will-based self-help document experience;</li>
            <li>storing legacy materials such as messages, videos, photos, letters, and family records; and</li>
            <li>storing important personal and legal-related documents in one place.</li>
          </ul>

          <h2 className="font-semibold mt-6 mb-2">3. No Legal, Financial, Tax, Fiduciary, or Professional Advice</h2>
          <p className="mb-4">
            KeepSave is not a law firm, not a financial services provider, not an insurer, not a bank, and not a fiduciary or estate administration service.
          </p>
          <p className="mb-4">
            We do not provide legal, financial, tax, estate-planning, investment, fiduciary, or other professional advice.
          </p>
          <p className="mb-4">
            All information, content, templates, checklists, workflows, tools, and platform features are provided for general informational and self-help purposes only.
          </p>
          <p className="mb-4">
            Your use of the platform does not create any attorney-client, advisory, fiduciary, or professional relationship with KeepSave.
          </p>
          <p className="mb-4">
            You remain solely responsible for obtaining independent professional advice where required.
          </p>

          <h2 className="font-semibold mt-6 mb-2">4. No Guarantee of Legal Validity or Suitability</h2>
          <p className="mb-4">
            We do not warrant or guarantee that any will, document, form, template, clause, instruction, or stored record created, uploaded, or downloaded through the platform:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>is legally valid or enforceable;</li>
            <li>is suitable for your specific circumstances;</li>
            <li>complies with the law of any jurisdiction;</li>
            <li>will be accepted by any authority; or</li>
            <li>fully reflects your legal rights or wishes.</li>
          </ul>

          <h2 className="font-semibold mt-6 mb-2">5. User Eligibility and Responsibility</h2>
          <p className="mb-4">
            By using this platform, you confirm that you are legally permitted to enter into binding agreements and will use the platform responsibly.
          </p>

          <h2 className="font-semibold mt-6 mb-2">6. User Content</h2>
          <p className="mb-4">
            You retain ownership of your content and grant KeepSave limited rights to store and process it.
          </p>

          <h2 className="font-semibold mt-6 mb-2">7. Platform Availability</h2>
          <p className="mb-4">
            We do not guarantee uninterrupted service. Users should maintain backups.
          </p>

          <h2 className="font-semibold mt-6 mb-2">8. Prohibited Use</h2>
          <p className="mb-4">
            Misuse, scraping, reverse engineering, or unlawful activity is prohibited.
          </p>

          <h2 className="font-semibold mt-6 mb-2">9. Intellectual Property</h2>
          <p className="mb-4">
            All platform content and materials are owned by KeepSave.
          </p>

          <h2 className="font-semibold mt-6 mb-2">12. Privacy</h2>
          <p className="mb-4">
            Personal information is processed in accordance with POPIA.
          </p>

          <h2 className="font-semibold mt-6 mb-2">14. Limitation of Liability</h2>
          <p className="mb-4">
            KeepSave is not liable for indirect or consequential damages.
          </p>

          <h2 className="font-semibold mt-6 mb-2">15. Indemnity</h2>
          <p className="mb-4">
            You agree to indemnify KeepSave against claims arising from misuse or breach.
          </p>

          <h2 className="font-semibold mt-6 mb-2">16. Changes to Terms</h2>
          <p className="mb-4">
            Continued use of the platform constitutes acceptance of updated terms.
          </p>

          <h2 className="font-semibold mt-6 mb-2">17. Governing Law</h2>
          <p className="mb-4">
            These Terms are governed by the laws of South Africa.
          </p>

          <h2 className="font-semibold mt-6 mb-2">18. Contact</h2>
          <p>
            KeepSave<br />
            Email: info@keepsave.co.za<br />
            Cape Town, South Africa
          </p>

        </section>
      </div>
    </main>
  );
}