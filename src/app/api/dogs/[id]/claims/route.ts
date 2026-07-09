import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createClaimSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(req.headers);
  if (isRateLimited(`create-claim:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many claims submitted recently. Please try again later." },
      { status: 429 }
    );
  }

  const json = await req.json();
  const parsed = createClaimSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const dog = await prisma.dog.findUnique({ where: { id } });
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (dog.status === "resolved" || dog.status === "expired") {
    return NextResponse.json(
      { error: "This listing is no longer accepting claims." },
      { status: 400 }
    );
  }

  // Honeypot tripped: silently pretend success so bots don't learn.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  await prisma.claim.create({
    data: {
      dogId: dog.id,
      claimantName: parsed.data.claimantName,
      claimantContact: parsed.data.claimantContact,
      proofAnswer: parsed.data.proofAnswer,
    },
  });

  if (dog.status === "active") {
    await prisma.dog.update({
      where: { id: dog.id },
      data: { status: "claim_pending" },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${dog.manageToken}`;
  const isLost = dog.listingType === "lost";

  await sendEmail({
    to: dog.finderEmail,
    subject: isLost
      ? `Someone may have spotted ${dog.dogName || "your dog"}`
      : "Someone thinks they recognize the dog you found",
    body: isLost
      ? `${parsed.data.claimantName} submitted a sighting for ${dog.dogName || "the dog"} you posted as lost.\n\nTheir contact info: ${parsed.data.claimantContact}\n\nWhat they said:\n"${parsed.data.proofAnswer}"\n\nReview all sightings and manage your listing here:\n${manageUrl}\n\nIf this sounds promising, reach out to them directly.`
      : `${parsed.data.claimantName} submitted a claim for the dog you posted.\n\nTheir contact info: ${parsed.data.claimantContact}\n\nWhat they said to identify the dog:\n"${parsed.data.proofAnswer}"\n\nReview all claims and manage your listing here:\n${manageUrl}\n\nIf this sounds legit, reach out to them directly. If it doesn't hold up, you can ignore it and wait for other claims.`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
