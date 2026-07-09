import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dev-only inbox so magic-link and claim-notification emails can be viewed
// without real email credentials. Emails here can include private manage
// links and finder contact info, so this must never be reachable outside
// local development regardless of RESEND_API_KEY.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const emails = await prisma.devEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ emails });
}
