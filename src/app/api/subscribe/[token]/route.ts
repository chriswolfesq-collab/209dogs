import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.subscriber.delete({ where: { id: subscriber.id } });
  return NextResponse.json({ ok: true });
}
