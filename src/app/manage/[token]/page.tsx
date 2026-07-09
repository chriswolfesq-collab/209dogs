"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Claim = {
  id: string;
  claimantName: string;
  claimantContact: string;
  proofAnswer: string;
  status: string;
  createdAt: string;
};

type ManagedDog = {
  id: string;
  status: string;
  photoUrl: string;
  foundLocation: string;
  foundDate: string;
  breedGuess: string | null;
  claims: Claim[];
};

export default function ManageDogPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [dog, setDog] = useState<ManagedDog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/manage/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Listing not found");
        setDog(data.dog);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Listing not found"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleResolve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/manage/${token}/resolve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setDog(data.dog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently? This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/manage/${token}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      router.push("/dogs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  if (loading) return <p className="mx-auto max-w-2xl px-4 py-12 text-center text-black/40">Loading…</p>;
  if (error || !dog)
    return (
      <p className="mx-auto max-w-2xl px-4 py-12 text-center text-red-600">
        {error ?? "Listing not found"}
      </p>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold">Manage Your Listing</h1>
      <p className="mb-6 text-sm text-black/60">
        Keep this link private — anyone with it can manage this listing.
      </p>

      <div className="mb-6 flex gap-4 rounded-lg border border-black/10 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dog.photoUrl}
          alt="Found dog"
          className="h-24 w-24 rounded object-cover"
        />
        <div>
          <div className="font-medium">{dog.breedGuess || "Unknown breed"}</div>
          <div className="text-sm text-black/60">{dog.foundLocation}</div>
          <div className="text-sm text-black/60">
            Found {new Date(dog.foundDate).toLocaleDateString()}
          </div>
          <div className="mt-1 text-sm font-medium capitalize">
            Status: {dog.status.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        {dog.status !== "resolved" && (
          <button
            onClick={handleResolve}
            disabled={busy}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Reunited
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete Listing
        </button>
      </div>

      <h2 className="mb-3 font-semibold">
        Claims {dog.claims.length > 0 ? `(${dog.claims.length})` : ""}
      </h2>

      {dog.claims.length === 0 ? (
        <p className="text-sm text-black/60">No one has claimed this dog yet.</p>
      ) : (
        <div className="space-y-3">
          {dog.claims.map((claim) => (
            <div key={claim.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{claim.claimantName}</span>
                <span className="text-xs text-black/40">
                  {new Date(claim.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm">
                Contact: <span className="font-medium">{claim.claimantContact}</span>
              </div>
              <p className="mt-2 text-sm text-black/70">&ldquo;{claim.proofAnswer}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
