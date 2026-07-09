import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const MAX_BYTES = 6 * 1024 * 1024; // 6MB, generous since client resizes first
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Uses Vercel Blob storage when BLOB_READ_WRITE_TOKEN is set (production).
// Otherwise falls back to saving in public/uploads for local dev, since
// Vercel's serverless filesystem is read-only/ephemeral.
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
