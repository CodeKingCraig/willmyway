function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function buildVerificationUrl(token: string) {
  return `${getAppUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token: string) {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${text}`);
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  fullName?: string | null;
  token: string;
}) {
  const verifyUrl = buildVerificationUrl(params.token);
  const greeting = params.fullName?.trim() ? `Hi ${params.fullName.trim()},` : "Hi,";

  const html = `
    <div style="margin:0;padding:32px;background:#f6f8fb;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:rgba(255,255,255,0.92);border:1px solid #e2e8f0;border-radius:24px;padding:40px;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">
          WillMyWay
        </div>

        <h1 style="margin:16px 0 12px;font-size:32px;line-height:1.2;color:#0f172a;">
          Verify your email
        </h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#475569;">
          ${greeting}
        </p>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#475569;">
          Welcome to WillMyWay. Please verify your email address to activate your account and start building your will.
        </p>

        <div style="margin:32px 0;">
          <a
            href="${verifyUrl}"
            style="display:inline-block;padding:14px 22px;border-radius:16px;background:#7b95bb;color:#ffffff;text-decoration:none;font-weight:700;"
          >
            Verify Email
          </a>
        </div>

        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#64748b;">
          This link expires in 24 hours.
        </p>

        <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;word-break:break-word;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${verifyUrl}" style="color:#6d87ad;">${verifyUrl}</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Verify your WillMyWay account",
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  fullName?: string | null;
  token: string;
}) {
  const resetUrl = buildPasswordResetUrl(params.token);
  const greeting = params.fullName?.trim() ? `Hi ${params.fullName.trim()},` : "Hi,";

  const html = `
    <div style="margin:0;padding:32px;background:#f6f8fb;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:rgba(255,255,255,0.92);border:1px solid #e2e8f0;border-radius:24px;padding:40px;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">
          WillMyWay
        </div>

        <h1 style="margin:16px 0 12px;font-size:32px;line-height:1.2;color:#0f172a;">
          Reset your password
        </h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#475569;">
          ${greeting}
        </p>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#475569;">
          We received a request to reset your WillMyWay password. Use the button below to choose a new one.
        </p>

        <div style="margin:32px 0;">
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:14px 22px;border-radius:16px;background:#7b95bb;color:#ffffff;text-decoration:none;font-weight:700;"
          >
            Reset Password
          </a>
        </div>

        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#64748b;">
          This link expires in 1 hour.
        </p>

        <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;word-break:break-word;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color:#6d87ad;">${resetUrl}</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Reset your WillMyWay password",
    html,
  });
}