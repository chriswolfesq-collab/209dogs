import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dev-only inbox so magic-link and claim-notification emails can be viewed
// without real email credentials. Not linked from production nav; guard
// against accidental exposure once RESEND_API_KEY is configured.
export async function GET() {
  if (process.env.RESEND_API_KEY) {
    return NextResponse.json({ emails: [] });
  }

  const emails = await prisma.devEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ emails });
}
