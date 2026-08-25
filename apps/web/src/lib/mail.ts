import "server-only";

import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function sendSupportNotification(input: { name: string; email: string; subject: string; message: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_SUPPORT_EMAIL;
  if (!apiKey || !from || !to) return { sent: false as const, reason: "not_configured" as const };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: input.email,
    subject: `[SyndeoCare Support] ${input.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#082936">
        <h1 style="font-size:22px">New support request</h1>
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
        <div style="margin-top:24px;padding:20px;border-radius:14px;background:#eef9fb;white-space:pre-wrap">${escapeHtml(input.message)}</div>
      </div>`,
  });

  return error ? { sent: false as const, reason: "provider_error" as const } : { sent: true as const };
}
