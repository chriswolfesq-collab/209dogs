import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// finderEmail, manageToken, and collarTagInfo are intentionally excluded —
// collarTagInfo is used as a claimant verification question and must stay
// private, never exposed to the public API. Covered by
// src/lib/__tests__/privacy.test.ts.
export const PUBLIC_DOG_SELECT = {
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
  notes: true,
  createdAt: true,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dog = await prisma.dog.findUnique({
    where: { id },
    select: PUBLIC_DOG_SELECT,
  });

  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ dog });
}
