import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import path from "path";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const MAX_BYTES = 6 * 1024 * 1024; // 6MB, generous since client resizes first
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Dev-mode storage: saves to public/uploads. In production, swap this for
// Supabase Storage (or S3) — the client already sends a pre-resized,
// EXIF-stripped blob, so only the storage destination needs to change.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`upload:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  const filename = `${nanoid(16)}.${ext}`;
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
