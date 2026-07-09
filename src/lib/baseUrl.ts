/**
 * Base URL used when building absolute links in outgoing emails.
 *
 * Prefers an explicit NEXT_PUBLIC_BASE_URL, then falls back to the Vercel
 * production domain (exposed automatically on deployed builds), so emails
 * sent from production never contain localhost links even if the env var
 * is missing.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
