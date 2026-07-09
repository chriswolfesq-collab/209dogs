// Minimal in-memory rate limiter. Good enough for a single-instance dev/small
// deployment; swap for a durable store (Upstash Redis, etc.) if this scales
// to multiple server instances.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > limit;
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
