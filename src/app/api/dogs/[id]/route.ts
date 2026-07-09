import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dog = await prisma.dog.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
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
      // finderEmail, manageToken, and collarTagInfo are intentionally
      // excluded — collarTagInfo is used as a claimant verification
      // question and must stay private, never exposed to the public API.
    },
  });

  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ dog });
}
