import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MANAGE_DOG_SELECT } from "../route";

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
    select: MANAGE_DOG_SELECT,
  });

  return NextResponse.json({ dog: updated });
}
