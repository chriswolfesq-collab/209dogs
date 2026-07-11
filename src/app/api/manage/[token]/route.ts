import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDogSchema } from "@/lib/validation";
import { resolveCity } from "@/lib/cities";
import { deletePhoto } from "@/lib/storage";
import { findManagedDog } from "@/lib/manageDog";

export const MANAGE_DOG_SELECT = {
  id: true,
  listingType: true,
  status: true,
  dogName: true,
  photoUrl: true,
  foundLat: true,
  foundLng: true,
  foundLocation: true,
  city: true,
  foundDate: true,
  breedGuess: true,
  size: true,
  color: true,
  hasCollar: true,
  collarTagInfo: true,
  temperament: true,
  holdingStatus: true,
  notes: true,
  claims: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      claimantName: true,
      claimantContact: true,
      proofAnswer: true,
      status: true,
      createdAt: true,
    },
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await findManagedDog(req, token, MANAGE_DOG_SELECT);

  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ dog });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await findManagedDog(req, token);
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json();
  const parsed = updateDogSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (dog.listingType === "lost" && !parsed.data.dogName?.trim()) {
    return NextResponse.json(
      { error: "Your dog's name is required" },
      { status: 400 }
    );
  }

  if (parsed.data.photoUrl !== dog.photoUrl) {
    await deletePhoto(dog.photoUrl);
  }

  const updated = await prisma.dog.update({
    where: { id: dog.id },
    data: {
      dogName: parsed.data.dogName,
      photoUrl: parsed.data.photoUrl,
      foundLat: parsed.data.foundLat,
      foundLng: parsed.data.foundLng,
      foundLocation: parsed.data.foundLocation,
      // Re-derived on every edit — the pin may have moved cities.
      city: resolveCity(parsed.data.city, parsed.data.foundLat, parsed.data.foundLng),
      foundDate: new Date(parsed.data.foundDate),
      breedGuess: parsed.data.breedGuess,
      size: parsed.data.size,
      color: parsed.data.color,
      hasCollar: parsed.data.hasCollar,
      collarTagInfo: parsed.data.collarTagInfo,
      temperament: parsed.data.temperament,
      holdingStatus: parsed.data.holdingStatus,
      notes: parsed.data.notes,
    },
    select: MANAGE_DOG_SELECT,
  });

  return NextResponse.json({ dog: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dog = await findManagedDog(req, token);
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.dog.delete({ where: { id: dog.id } });
  await deletePhoto(dog.photoUrl);
  return NextResponse.json({ ok: true });
}
