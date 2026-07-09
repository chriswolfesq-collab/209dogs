import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await prisma.dog.findUnique({
    where: { manageToken: token },
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

  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ dog });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await prisma.dog.findUnique({ where: { manageToken: token } });
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.dog.delete({ where: { id: dog.id } });
  return NextResponse.json({ ok: true });
}
