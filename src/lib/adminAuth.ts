import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function timingSafeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Cookie holds a hash of the password rather than the password itself, so a
// leaked cookie can't be used to log in anywhere else the password is reused.
function sessionToken(password: string) {
  return crypto.createHash("sha256").update(`admin-session:${password}`).digest("hex");
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(password, expected);
}

export function adminSessionToken(): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return null;
  return sessionToken(expected);
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminSessionToken();
  if (!expected) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  return timingSafeEqual(value, expected);
}

export function isAdminRequest(req: NextRequest): boolean {
  const expected = adminSessionToken();
  if (!expected) return false;
  const value = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  return timingSafeEqual(value, expected);
}
