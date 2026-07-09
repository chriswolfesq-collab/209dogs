import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendEmailBatch, renderEmailHtml, escapeHtml } from "@/lib/email";
import { createDogSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { LISTING_LIFETIME_DAYS } from "@/lib/constants";
import { getBaseUrl } from "@/lib/baseUrl";
import { findPotentialMatches } from "@/lib/matching";

// finderEmail and manageToken must never appear here — this select backs
// the public browse API. collarTagInfo is also excluded: it's used as a
// claimant verification question and must stay private (see
// src/app/api/dogs/[id]/route.ts). Covered by src/lib/__tests__/privacy.test.ts.
export const PUBLIC_DOG_LIST_SELECT = {
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
} as const;

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
      expiresAt: { gt: new Date() },
      ...(type && ["found", "lost"].includes(type)
        ? { listingType: type as "found" | "lost" }
        : {}),
      ...(size && ["small", "medium", "large"].includes(size)
        ? { size: size as "small" | "medium" | "large" }
        : {}),
      ...(color ? { color: { contains: color, mode: "insensitive" } } : {}),
      ...(q ? { foundLocation: { contains: q, mode: "insensitive" } } : {}),
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
    select: PUBLIC_DOG_LIST_SELECT,
  });

  return NextResponse.json({ dogs });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`create-dog:${ip}`, 5, 60 * 60 * 1000)) {
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

  const matches = await findPotentialMatches({
    id: dog.id,
    listingType: dog.listingType,
    foundLat: dog.foundLat,
    foundLng: dog.foundLng,
    foundDate: dog.foundDate,
  });

  if (matches.length > 0) {
    const matchListHtml = matches
      .map(
        (m) =>
          `<li><a href="${baseUrl}/dogs/${m.id}">${escapeHtml(m.dogName || m.breedGuess || "A dog")} near ${escapeHtml(m.foundLocation)}</a></li>`
      )
      .join("");
    const matchListText = matches
      .map(
        (m) => `- ${m.dogName || m.breedGuess || "A dog"} near ${m.foundLocation}: ${baseUrl}/dogs/${m.id}`
      )
      .join("\n");

    await sendEmailBatch([
      {
        to: parsed.data.finderEmail,
        subject: isLost
          ? "Possible matches for your lost dog"
          : "Possible matches for the dog you found",
        body: `We found ${matches.length} ${isLost ? "found" : "lost"} dog report(s) near your listing that might be a match:\n\n${matchListText}\n\nTake a look and reach out through the listing if one looks right.`,
        html: renderEmailHtml(
          `<p>We found ${matches.length} ${isLost ? "found" : "lost"} dog report(s) near your listing that might be a match:</p>
<ul>${matchListHtml}</ul>
<p>Take a look and reach out through the listing if one looks right.</p>`
        ),
      },
      ...matches.map((m) => ({
        to: m.finderEmail,
        subject: isLost
          ? "A dog was just found that might be yours"
          : "Someone just reported a dog that might match yours",
        body: `A new ${isLost ? "found" : "lost"} dog report was just posted near ${parsed.data.foundLocation} that might match yours:\n${listingUrl}\n\nTake a look and see if it matches.`,
        html: renderEmailHtml(
          `<p>A new ${isLost ? "found" : "lost"} dog report was just posted near ${escapeHtml(parsed.data.foundLocation)} that might match yours:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<p>Take a look and see if it matches.</p>`
        ),
      })),
    ]);
  }

  const subscribers = await prisma.subscriber.findMany({
    where: { email: { not: parsed.data.finderEmail }, confirmed: true },
  });

  const dogLabel = dog.dogName || parsed.data.breedGuess || "A dog";
  const alertSubject = isLost
    ? `Lost dog alert: ${dogLabel} in Stockton, CA`
    : `Found dog alert: ${dogLabel} in Stockton, CA`;

  await sendEmailBatch(
    subscribers.map((subscriber) => {
      const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber.unsubscribeToken}`;
      return {
        to: subscriber.email,
        subject: alertSubject,
        body: `A new ${isLost ? "lost" : "found"} dog was just posted near ${parsed.data.foundLocation}.\n\nView the listing:\n${listingUrl}\n\nUnsubscribe from these alerts:\n${unsubscribeUrl}`,
        html: renderEmailHtml(
          `<p>A new ${isLost ? "lost" : "found"} dog was just posted near ${escapeHtml(parsed.data.foundLocation)}.</p>
<p><a href="${listingUrl}">View the listing</a></p>
<p><a href="${unsubscribeUrl}">Unsubscribe</a> from these alerts.</p>`
        ),
      };
    })
  );

  return NextResponse.json({ id: dog.id, manageToken }, { status: 201 });
}
