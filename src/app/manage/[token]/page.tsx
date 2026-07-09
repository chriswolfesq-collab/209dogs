"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";
import LocationAutocomplete, { type LocationSuggestion } from "@/components/LocationAutocomplete";

const DogMap = dynamic(() => import("@/components/DogMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[250px] items-center justify-center rounded-lg border border-black/10 bg-neutral-100 text-black/40">
      Loading map…
    </div>
  ),
});

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
  listingType: string;
  status: string;
  dogName: string | null;
  photoUrl: string;
  foundLat: number;
  foundLng: number;
  foundLocation: string;
  foundDate: string;
  breedGuess: string | null;
  size: string | null;
  color: string | null;
  hasCollar: boolean;
  collarTagInfo: string | null;
  temperament: string | null;
  holdingStatus: string;
  notes: string | null;
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
  const [editing, setEditing] = useState(false);

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

  if (editing) {
    return (
      <EditDogForm
        token={token}
        dog={dog}
        onSaved={(updated) => {
          setDog(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isLost = dog.listingType === "lost";

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
          alt={isLost ? "Lost dog" : "Found dog"}
          className="h-24 w-24 rounded object-cover"
        />
        <div>
          <div className="font-medium">
            {dog.dogName || dog.breedGuess || "Unknown breed"}
          </div>
          <div className="text-sm text-black/60">{dog.foundLocation}</div>
          <div className="text-sm text-black/60">
            {isLost ? "Last seen" : "Found"} {new Date(dog.foundDate).toLocaleDateString()}
          </div>
          <div className="mt-1 text-sm font-medium capitalize">
            Status: {dog.status.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setEditing(true)}
          disabled={busy}
          className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
        >
          Edit Listing
        </button>
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
        {isLost ? "Sightings" : "Claims"} {dog.claims.length > 0 ? `(${dog.claims.length})` : ""}
      </h2>

      {dog.claims.length === 0 ? (
        <p className="text-sm text-black/60">
          {isLost ? "No one has reported a sighting yet." : "No one has claimed this dog yet."}
        </p>
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

function EditDogForm({
  token,
  dog,
  onSaved,
  onCancel,
}: {
  token: string;
  dog: ManagedDog;
  onSaved: (dog: ManagedDog) => void;
  onCancel: () => void;
}) {
  const isLost = dog.listingType === "lost";

  const [photoUrl, setPhotoUrl] = useState<string | null>(dog.photoUrl);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>({
    lat: dog.foundLat,
    lng: dog.foundLng,
  });
  const [foundLocation, setFoundLocation] = useState(dog.foundLocation);
  const [foundDate, setFoundDate] = useState(dog.foundDate.slice(0, 10));
  const [dogName, setDogName] = useState(dog.dogName ?? "");
  const [breedGuess, setBreedGuess] = useState(dog.breedGuess ?? "");
  const [size, setSize] = useState(dog.size ?? "");
  const [color, setColor] = useState(dog.color ?? "");
  const [hasCollar, setHasCollar] = useState(dog.hasCollar);
  const [collarTagInfo, setCollarTagInfo] = useState(dog.collarTagInfo ?? "");
  const [temperament, setTemperament] = useState(dog.temperament ?? "");
  const [holdingStatus, setHoldingStatus] = useState(dog.holdingStatus);
  const [notes, setNotes] = useState(dog.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectSuggestion(suggestion: LocationSuggestion) {
    setLocation({ lat: suggestion.lat, lng: suggestion.lng });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photoUrl) return setError("Please add a photo of the dog.");
    if (isLost && !dogName.trim()) return setError("Please enter your dog's name.");
    if (!foundLocation.trim()) return setError("Please describe the location.");
    if (!location)
      return setError(
        "Please pick a location from the suggestions, or click the map to place a pin."
      );

    setSubmitting(true);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dogName: dogName || null,
          photoUrl,
          foundLat: location.lat,
          foundLng: location.lng,
          foundLocation,
          foundDate,
          breedGuess: breedGuess || null,
          size: size || null,
          color: color || null,
          hasCollar,
          collarTagInfo: collarTagInfo || null,
          temperament: temperament || null,
          holdingStatus,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onSaved(data.dog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold">Edit Listing</h1>
      <p className="mb-6 text-sm text-black/60">Update the details below and save your changes.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Photo</label>
          <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
        </div>

        {isLost && (
          <div>
            <label className="mb-1 block text-sm font-medium">Your dog&apos;s name</label>
            <input
              type="text"
              required
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">
            {isLost ? "Where did you last see your dog?" : "Where did you find the dog?"}
          </label>
          <LocationAutocomplete
            id="location"
            value={foundLocation}
            onChangeText={setFoundLocation}
            onSelect={handleSelectSuggestion}
            placeholder="e.g. Stockton Courthouse, or Louis Park"
          />
          <div className="mt-2">
            <DogMap
              dogs={[]}
              height="250px"
              onPickLocation={(lat, lng) => setLocation({ lat, lng })}
              pickedLocation={location}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {isLost ? "Date last seen" : "Date found"}
            </label>
            <input
              type="date"
              required
              value={foundDate}
              onChange={(e) => setFoundDate(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
          {!isLost && (
            <div>
              <label className="mb-1 block text-sm font-medium">Is the dog currently...</label>
              <select
                value={holdingStatus}
                onChange={(e) => setHoldingStatus(e.target.value)}
                className="w-full rounded border border-black/20 px-3 py-2 text-sm"
              >
                <option value="holding">With me / a safe location</option>
                <option value="still_loose">Still loose (I couldn&apos;t catch it)</option>
                <option value="taken_to_shelter">Taken to a shelter</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Breed guess</label>
            <input
              type="text"
              value={breedGuess}
              onChange={(e) => setBreedGuess(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            >
              <option value="">Not sure</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="hasCollar"
            type="checkbox"
            checked={hasCollar}
            onChange={(e) => setHasCollar(e.target.checked)}
          />
          <label htmlFor="hasCollar" className="text-sm font-medium">
            Has a collar or tags
          </label>
        </div>

        {hasCollar && (
          <div>
            <label className="mb-1 block text-sm font-medium">Collar/tag details</label>
            <input
              type="text"
              value={collarTagInfo}
              onChange={(e) => setCollarTagInfo(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Temperament</label>
          <input
            type="text"
            value={temperament}
            onChange={(e) => setTemperament(e.target.value)}
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Other notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
