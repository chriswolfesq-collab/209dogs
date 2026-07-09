"use client";

import { useState } from "react";
import { processImageFile } from "@/lib/image";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export default function PhotoUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const processed = await processImageFile(file);
      const formData = new FormData();
      formData.append("file", processed, "photo.jpg");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Dog you found"
            className="w-full rounded-lg border border-black/10 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Remove photo
          </button>
        </div>
      ) : (
        <label className="flex w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 p-6 text-center text-sm text-black/60 hover:border-black/40">
          {uploading ? (
            <span>Uploading…</span>
          ) : (
            <>
              <span className="font-medium">Add a photo</span>
              <span className="text-xs">JPG, PNG, or WebP</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
