import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await prisma.dog.findUnique({ where: { manageToken: token } });
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.dog.update({
    where: { id: dog.id },
    data: { status: "resolved", resolvedAt: new Date() },
    select: {
      id: true,
      status: true,
      photoUrl: true,
      foundLocation: true,
      foundDate: true,
      breedGuess: true,
      claims: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          claimantName: true,
          claimantContact: true,
          proofAnswer: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({ dog: updated });
}
