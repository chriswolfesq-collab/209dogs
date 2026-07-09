import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const subscriber = await prisma.subscriber.findUnique({
    where: { confirmToken: token },
  });
  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!subscriber.confirmed) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { confirmed: true },
    });
  }

  return NextResponse.json({ ok: true });
}
