import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendEmail, renderEmailHtml, escapeHtml } from "@/lib/email";
import { createDogSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { LISTING_LIFETIME_DAYS } from "@/lib/constants";
import { getBaseUrl } from "@/lib/baseUrl";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const size = searchParams.get("size");
  const color = searchParams.get("color");
  const q = searchParams.get("q"); // free text over location description
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const type = searchParams.get("type"); // "found" | "lost"
  const includeReunited = searchParams.get("includeReunited") === "1";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  const parsedDateFrom = dateFrom ? new Date(dateFrom) : undefined;
  const parsedDateTo = dateTo ? new Date(dateTo) : undefined;
  if (
    (parsedDateFrom && Number.isNaN(parsedDateFrom.getTime())) ||
    (parsedDateTo && Number.isNaN(parsedDateTo.getTime()))
  ) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dogs = await prisma.dog.findMany({
    where: {
      status: {
        in: includeReunited
          ? ["active", "claim_pending", "resolved"]
          : ["active", "claim_pending"],
      },
      ...(type && ["found", "lost"].includes(type)
        ? { listingType: type as "found" | "lost" }
        : {}),
      ...(size && ["small", "medium", "large"].includes(size)
        ? { size: size as "small" | "medium" | "large" }
        : {}),
      ...(color ? { color: { contains: color } } : {}),
      ...(q ? { foundLocation: { contains: q } } : {}),
      ...(parsedDateFrom || parsedDateTo
        ? {
            foundDate: {
              ...(parsedDateFrom ? { gte: parsedDateFrom } : {}),
              ...(parsedDateTo ? { lte: parsedDateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
    select: {
      id: true,
      listingType: true,
      status: true,
      dogName: true,
      photoUrl: true,
      foundLat: true,
      foundLng: true,
      foundLocation: true,
      foundDate: true,
      breedGuess: true,
      size: true,
      color: true,
      hasCollar: true,
      temperament: true,
      holdingStatus: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ dogs });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`create-dog:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many listings created recently. Please try again later." },
      { status: 429 }
    );
  }

  const json = await req.json();
  const parsed = createDogSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Honeypot tripped: silently pretend success so bots don't learn.
  if (parsed.data.website) {
    return NextResponse.json({ id: "ok" }, { status: 201 });
  }

  const manageToken = nanoid(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

  const dog = await prisma.dog.create({
    data: {
      listingType: parsed.data.listingType,
      dogName: parsed.data.dogName,
      photoUrl: parsed.data.photoUrl,
      foundLat: parsed.data.foundLat,
      foundLng: parsed.data.foundLng,
      foundLocation: parsed.data.foundLocation,
      foundDate: new Date(parsed.data.foundDate),
      breedGuess: parsed.data.breedGuess,
      size: parsed.data.size,
      color: parsed.data.color,
      hasCollar: parsed.data.hasCollar,
      collarTagInfo: parsed.data.collarTagInfo,
      temperament: parsed.data.temperament,
      holdingStatus: parsed.data.holdingStatus,
      notes: parsed.data.notes,
      finderEmail: parsed.data.finderEmail,
      manageToken,
      expiresAt,
    },
  });

  const baseUrl = getBaseUrl();
  const manageUrl = `${baseUrl}/manage/${manageToken}`;
  const isLost = parsed.data.listingType === "lost";

  const listingUrl = `${baseUrl}/dogs/${dog.id}`;
  const claimsLabel = isLost ? "sightings" : "claims";

  await sendEmail({
    to: parsed.data.finderEmail,
    subject: isLost
      ? "Your lost dog listing on Stockton, CA Found Dogs"
      : "Your found dog listing on Stockton, CA Found Dogs",
    body: `Thanks for posting! Your listing is live at ${listingUrl}.\n\nUse this private link any time to see ${claimsLabel}, mark the dog reunited, or remove the listing:\n${manageUrl}\n\nKeep this link safe — anyone with it can manage your listing. This listing will expire automatically in ${LISTING_LIFETIME_DAYS} days unless you renew it.`,
    html: renderEmailHtml(
      `<p>Thanks for posting! Your listing is live at <a href="${listingUrl}">${listingUrl}</a>.</p>
<p>Use this private link any time to see ${claimsLabel}, mark the dog reunited, or remove the listing:</p>
<p><a href="${manageUrl}">${manageUrl}</a></p>
<p>Keep this link safe — anyone with it can manage your listing. This listing will expire automatically in ${LISTING_LIFETIME_DAYS} days unless you renew it.</p>`
    ),
  });

  const subscribers = await prisma.subscriber.findMany({
    where: { email: { not: parsed.data.finderEmail } },
  });

  const dogLabel = dog.dogName || parsed.data.breedGuess || "A dog";
  const alertSubject = isLost
    ? `Lost dog alert: ${dogLabel} in Stockton, CA`
    : `Found dog alert: ${dogLabel} in Stockton, CA`;

  await Promise.all(
    subscribers.map((subscriber) => {
      const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber.unsubscribeToken}`;
      return sendEmail({
        to: subscriber.email,
        subject: alertSubject,
        body: `A new ${isLost ? "lost" : "found"} dog was just posted near ${parsed.data.foundLocation}.\n\nView the listing:\n${listingUrl}\n\nUnsubscribe from these alerts:\n${unsubscribeUrl}`,
        html: renderEmailHtml(
          `<p>A new ${isLost ? "lost" : "found"} dog was just posted near ${escapeHtml(parsed.data.foundLocation)}.</p>
<p><a href="${listingUrl}">View the listing</a></p>
<p><a href="${unsubscribeUrl}">Unsubscribe</a> from these alerts.</p>`
        ),
      });
    })
  );

  return NextResponse.json({ id: dog.id, manageToken }, { status: 201 });
}
