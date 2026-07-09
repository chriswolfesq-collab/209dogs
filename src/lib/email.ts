import { prisma } from "@/lib/prisma";

type SendEmailArgs = {
  to: string;
  subject: string;
  body: string;
  html?: string;
};

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Wraps templated paragraph HTML in a minimal document. A real html part
 * (not just plain text) keeps Gmail from collapsing the message behind a
 * "show trimmed content" button, which it does to plain-text emails once
 * it recognizes a repeated template from the same sender.
 */
export function renderEmailHtml(bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #111;">${bodyHtml}</body></html>`;
}

/**
 * Sends email via Resend when RESEND_API_KEY is set. Otherwise (local dev),
 * logs the email to the DevEmail table so it can be viewed at /dev/emails
 * without needing real email credentials.
 *
 * Never throws: a claim or listing should still succeed even if notifying
 * the recipient fails. Failures are logged to stderr instead so they show
 * up in server logs rather than silently vanishing.
 */
export async function sendEmail({ to, subject, body, html }: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;

  try {
    if (!apiKey) {
      await prisma.devEmail.create({ data: { to, subject, body } });
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text: body,
        ...(html ? { html } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to send email via Resend: ${errText}`);
    }
  } catch (err) {
    console.error("[email] failed to send", { to, subject }, err);
  }
}
