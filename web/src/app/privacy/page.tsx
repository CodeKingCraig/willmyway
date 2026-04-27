import Link from "next/link";

export default function PrivacyPage() {
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

          <h1 className="mb-6 text-3xl font-bold text-slate-800">
            KEEP SAVE PRIVACY POLICY
          </h1>

          <p className="mb-6">
            <strong>Effective Date:</strong> 21 April 2026<br />
            <strong>Company:</strong> KeepSave<br />
            <strong>Website:</strong> https://www.keepsave.co.za
          </p>

          <h2 className="mb-2 mt-6 font-semibold">1. Introduction</h2>
          <p className="mb-4">
            KeepSave respects your privacy and is committed to protecting your personal information.
          </p>
          <p className="mb-4">
            This Privacy Policy explains how we collect, use, store, share, and protect personal information when you use our website and platform.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">2. Information We Collect</h2>
          <ul className="mb-4 ml-6 list-disc">
            <li>name and surname;</li>
            <li>contact details such as email address and phone number;</li>
            <li>account and login information;</li>
            <li>billing and subscription information;</li>
            <li>identity and profile details you choose to upload;</li>
            <li>documents, photos, videos, messages, and legacy materials you store on the platform;</li>
            <li>technical information such as IP address, browser type, device information, cookies, and usage data; and</li>
            <li>communications you send to us.</li>
          </ul>

          <h2 className="mb-2 mt-6 font-semibold">3. How We Use Personal Information</h2>
          <ul className="mb-4 ml-6 list-disc">
            <li>create and manage your account;</li>
            <li>provide and maintain the platform;</li>
            <li>store and organise your uploaded content;</li>
            <li>communicate with you about your account or service updates;</li>
            <li>improve website performance, support, and user experience;</li>
            <li>process subscriptions or payments;</li>
            <li>detect fraud, abuse, and security issues; and</li>
            <li>comply with legal or regulatory obligations.</li>
          </ul>

          <h2 className="mb-2 mt-6 font-semibold">4. Why We Process Information</h2>
          <ul className="mb-4 ml-6 list-disc">
            <li>provide the services you requested;</li>
            <li>perform our obligations to you;</li>
            <li>pursue legitimate business interests in operating and improving the platform;</li>
            <li>comply with legal duties; or</li>
            <li>where applicable, rely on your consent.</li>
          </ul>

          <h2 className="mb-2 mt-6 font-semibold">5. Sharing of Information</h2>
          <p className="mb-4">We do not sell your personal information.</p>
          <ul className="mb-4 ml-6 list-disc">
            <li>trusted service providers who help us operate the platform;</li>
            <li>payment processors;</li>
            <li>cloud hosting or storage providers;</li>
            <li>analytics and security providers;</li>
            <li>professional advisors where necessary; and</li>
            <li>regulators, law enforcement, or authorities where required by law.</li>
          </ul>

          <h2 className="mb-2 mt-6 font-semibold">6. Data Storage and Security</h2>
          <p className="mb-4">
            We take reasonable technical and organisational measures to protect personal information and stored content from loss, misuse, unauthorised access, disclosure, alteration, or destruction.
          </p>
          <p className="mb-4">
            However, no online system can guarantee absolute security.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">7. International Transfers</h2>
          <p className="mb-4">
            If any of our service providers or infrastructure are located outside South Africa, your personal information may be transferred and stored outside South Africa. Where this happens, we take reasonable steps to ensure appropriate protection is in place.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">8. Retention</h2>
          <p className="mb-4">
            We keep personal information only for as long as reasonably necessary to provide the platform, comply with legal obligations, resolve disputes, enforce agreements, and maintain business records.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">9. Your Rights</h2>
          <ul className="mb-4 ml-6 list-disc">
            <li>request access to your personal information;</li>
            <li>request correction of inaccurate information;</li>
            <li>object to certain processing;</li>
            <li>request deletion where appropriate;</li>
            <li>withdraw consent where processing is based on consent; and</li>
            <li>lodge a complaint with the Information Regulator.</li>
          </ul>

          <h2 className="mb-2 mt-6 font-semibold">10. Cookies and Analytics</h2>
          <p className="mb-4">
            We may use cookies and similar technologies to improve website performance, remember preferences, understand user behaviour, and support security and analytics.
          </p>
          <p className="mb-4">
            You can usually control cookies through your browser settings.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">11. Children</h2>
          <p className="mb-4">
            Our platform is intended for adults or persons legally able to use the service. If personal information of minors is involved, the user uploading that information is responsible for ensuring that they are lawfully entitled to do so.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">12. Third-Party Services</h2>
          <p className="mb-4">
            Our website or platform may contain links to or integrations with third-party services. We are not responsible for the privacy practices of third parties.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">13. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. The latest version will always appear on our website with the effective date.
          </p>

          <h2 className="mb-2 mt-6 font-semibold">14. Contact Details</h2>
          <p>
            KeepSave<br />
            Email: info@keepsave.co.za<br />
            Address: Cape Town, South Africa 7550<br />
            Information Officer: Berne de Klerk
          </p>

        </section>
      </div>
    </main>
  );
}