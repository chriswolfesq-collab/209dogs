import { unlink } from "fs/promises";
import path from "path";
import { del } from "@vercel/blob";

/**
 * Deletes a previously uploaded dog photo, whether it lives in Vercel Blob
 * (production, or local dev with BLOB_READ_WRITE_TOKEN set) or in
 * public/uploads (local dev fallback — see api/upload/route.ts).
 *
 * Never throws: a listing edit/delete/resolve should still succeed even if
 * cleaning up the old photo fails. Failures are logged to stderr instead.
 */
export async function deletePhoto(url: string) {
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", url);
      await unlink(filePath);
      return;
    }
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url);
    }
  } catch (err) {
    console.error("[storage] failed to delete photo", { url }, err);
  }
}
