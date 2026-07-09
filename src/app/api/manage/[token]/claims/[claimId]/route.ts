import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateClaimStatusSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; claimId: string }> }
) {
  const { token, claimId } = await params;

  const json = await req.json();
  const parsed = updateClaimStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const dog = await prisma.dog.findUnique({ where: { manageToken: token } });
  if (!dog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim || claim.dogId !== dog.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.claim.update({
    where: { id: claimId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ claim: updated });
}
