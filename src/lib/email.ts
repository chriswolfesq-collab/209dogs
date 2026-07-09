import { prisma } from "@/lib/prisma";

type SendEmailArgs = {
  to: string;
  subject: string;
  body: string;
};

/**
 * Sends email via Resend when RESEND_API_KEY is set. Otherwise (local dev),
 * logs the email to the DevEmail table so it can be viewed at /dev/emails
 * without needing real email credentials.
 */
export async function sendEmail({ to, subject, body }: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;

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
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to send email via Resend: ${errText}`);
  }
}
