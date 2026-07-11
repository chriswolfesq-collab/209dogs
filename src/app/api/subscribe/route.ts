import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendEmail, renderEmailHtml } from "@/lib/email";
import { subscribeSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { getBaseUrl } from "@/lib/baseUrl";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`subscribe:${ip}`, 5, 60 * 60 * 1000)) {
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

  // Re-submitting the form is also how an existing subscriber changes their
  // city preferences, so cities is written on both branches.
  const subscriber = await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    update: { cities: parsed.data.cities },
    create: {
      email: parsed.data.email,
      cities: parsed.data.cities,
      confirmToken: nanoid(32),
      unsubscribeToken: nanoid(32),
    },
  });

  // Already confirmed (e.g. re-submitting the form): nothing to do, and
  // don't re-send a confirm email for an address that isn't waiting on one.
  if (subscriber.confirmed) {
    return NextResponse.json({ ok: true });
  }

  const baseUrl = getBaseUrl();
  const confirmUrl = `${baseUrl}/subscribe/confirm/${subscriber.confirmToken}`;

  const coverage =
    parsed.data.cities.length > 0
      ? `in ${parsed.data.cities.join(", ")}`
      : "anywhere in the 209";

  await sendEmail({
    to: parsed.data.email,
    subject: "Confirm your 209 Lost & Found Dogs alerts",
    body: `Someone (hopefully you) asked to get emailed whenever a new lost or found dog is posted ${coverage} on 209 Lost & Found Dogs.\n\nConfirm your subscription:\n${confirmUrl}\n\nIf this wasn't you, just ignore this email — you won't be subscribed.`,
    html: renderEmailHtml(
      `<p>Someone (hopefully you) asked to get emailed whenever a new lost or found dog is posted ${coverage} on 209 Lost &amp; Found Dogs.</p>
<p><a href="${confirmUrl}">Confirm your subscription</a></p>
<p>If this wasn't you, just ignore this email — you won't be subscribed.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
