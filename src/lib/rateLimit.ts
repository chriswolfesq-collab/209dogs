import { prisma } from "@/lib/prisma";

// Postgres-backed sliding-window rate limiter. An in-memory Map doesn't work
// on Vercel: serverless functions are multi-instance and recycled constantly,
// so an in-memory counter resets far more often than the window implies and
// isn't shared across concurrent instances anyway.
export async function isRateLimited(key: string, limit: number, windowMs: number) {
  const windowStart = new Date(Date.now() - windowMs);

  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  });

  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  await prisma.rateLimitHit.create({ data: { key } });

  return count >= limit;
}

export function getClientIp(headers: Headers) {
  // x-real-ip is set by the trusted reverse proxy itself and can't be
  // spoofed by the client. x-forwarded-for's first entry is client-supplied
  // and trivially spoofable, so as a fallback we take the *last* entry —
  // the hop appended by our own proxy — assuming a single trusted proxy in
  // front of the app.
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim());
    return hops[hops.length - 1];
  }
  return "unknown";
}
