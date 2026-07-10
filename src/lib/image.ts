import { orientation as readOrientation } from "exifr";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/**
 * Resizes an image client-side and re-encodes it via canvas. Canvas export
 * does not carry over EXIF metadata, so this also strips GPS/location data
 * that phones embed in photos (important: finders may photograph a dog at
 * home, and we never want to leak their address).
 *
 * EXIF orientation is read first and applied as a canvas rotation, since
 * stripping EXIF would otherwise leave sideways/upside-down photos from
 * phones that rely on the orientation tag instead of rotating pixels.
 */
export async function processImageFile(file: File): Promise<Blob> {
  const orientation = (await readOrientation(file).catch(() => 1)) ?? 1;
  // Some browsers (notably Safari/iOS) auto-rotate the decoded bitmap based
  // on EXIF orientation while others (Chrome) don't. Forcing "none" here
  // keeps decoding consistent so the orientation transform below is the only
  // rotation ever applied, avoiding double-rotated photos on iOS uploads.
  const bitmap = await createImageBitmap(file, { imageOrientation: "none" });

  const swapDimensions = orientation >= 5 && orientation <= 8;
  const srcWidth = bitmap.width;
  const srcHeight = bitmap.height;
  const outWidth = swapDimensions ? srcHeight : srcWidth;
  const outHeight = swapDimensions ? srcWidth : srcHeight;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(outWidth, outHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(outWidth * scale);
  canvas.height = Math.round(outHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.save();
  ctx.scale(scale, scale);
  applyOrientationTransform(ctx, orientation, srcWidth, srcHeight);
  ctx.drawImage(bitmap, 0, 0);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
) {
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }
}
