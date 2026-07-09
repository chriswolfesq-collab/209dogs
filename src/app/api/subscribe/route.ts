import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendEmail, renderEmailHtml } from "@/lib/email";
import { subscribeSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { getBaseUrl } from "@/lib/baseUrl";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`subscribe:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const json = await req.json();
  const parsed = subscribeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Honeypot tripped: silently pretend success so bots don't learn.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const subscriber = await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, unsubscribeToken: nanoid(32) },
  });

  const baseUrl = getBaseUrl();
  const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber.unsubscribeToken}`;

  await sendEmail({
    to: parsed.data.email,
    subject: "You're subscribed to Stockton Found Dogs alerts",
    body: `You'll now get an email whenever a new lost or found dog is posted on Stockton Found Dogs.\n\nDidn't sign up for this? Unsubscribe here:\n${unsubscribeUrl}`,
    html: renderEmailHtml(
      `<p>You'll now get an email whenever a new lost or found dog is posted on Stockton Found Dogs.</p>
<p><a href="${unsubscribeUrl}">Unsubscribe</a> at any time.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
