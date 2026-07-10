const EDIT_MAX_DIMENSION = 2000;
const OUTPUT_MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

/**
 * Decodes a file for the crop/rotate editor. Uses an <img> element rather
 * than createImageBitmap: browsers apply EXIF orientation consistently when
 * decoding for <img>/canvas, whereas createImageBitmap's orientation default
 * differs by browser (this previously caused photos to come out double- or
 * un-rotated depending on the phone). Re-encoding through canvas here also
 * strips EXIF/GPS metadata that phones embed in photos.
 */
export async function loadImageForEdit(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, EDIT_MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function rotatedBounds(width: number, height: number, rotationDegrees: number) {
  const rad = (rotationDegrees * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Applies the user's chosen rotation and crop rectangle (in the rotated
 * image's coordinate space, as produced by react-easy-crop) and re-encodes
 * the result, scaled down to a reasonable upload size.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotationDegrees: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const rad = (rotationDegrees * Math.PI) / 180;
  const { width: boxWidth, height: boxHeight } = rotatedBounds(
    image.width,
    image.height,
    rotationDegrees
  );

  const rotateCanvas = document.createElement("canvas");
  rotateCanvas.width = boxWidth;
  rotateCanvas.height = boxHeight;
  const rotateCtx = rotateCanvas.getContext("2d");
  if (!rotateCtx) throw new Error("Canvas not supported");

  rotateCtx.translate(boxWidth / 2, boxHeight / 2);
  rotateCtx.rotate(rad);
  rotateCtx.translate(-image.width / 2, -image.height / 2);
  rotateCtx.drawImage(image, 0, 0);

  const scale = Math.min(1, OUTPUT_MAX_DIMENSION / Math.max(pixelCrop.width, pixelCrop.height));
  const outCanvas = document.createElement("canvas");
  outCanvas.width = Math.round(pixelCrop.width * scale);
  outCanvas.height = Math.round(pixelCrop.height * scale);
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Canvas not supported");

  outCtx.drawImage(
    rotateCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outCanvas.width,
    outCanvas.height
  );

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
