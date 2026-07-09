"use client";

import { useState } from "react";
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

type ListingType = "found" | "lost";

const COPY: Record<
  ListingType,
  {
    heading: string;
    intro: string;
    photoLabel: string;
    locationLabel: string;
    locationPlaceholder: string;
    dateLabel: string;
    submitLabel: string;
    submittingLabel: string;
  }
> = {
  found: {
    heading: "Report a Found Dog",
    intro:
      "Your contact info is never shown publicly. If someone claims this dog, we'll email you their contact info so you can reach out directly.",
    photoLabel: "Photo",
    locationLabel: "Where did you find the dog?",
    locationPlaceholder: "e.g. Stockton Courthouse, or Louis Park",
    dateLabel: "Date found",
    submitLabel: "Post Listing",
    submittingLabel: "Posting…",
  },
  lost: {
    heading: "Report a Lost Dog",
    intro:
      "Your contact info is never shown publicly. If someone spots your dog, we'll email you their contact info so you can connect directly.",
    photoLabel: "Photo of your dog",
    locationLabel: "Where did you last see your dog?",
    locationPlaceholder: "e.g. Stockton Courthouse, or Louis Park",
    dateLabel: "Date last seen",
    submitLabel: "Post Lost Dog Listing",
    submittingLabel: "Posting…",
  },
};

export default function ListingForm({ listingType }: { listingType: ListingType }) {
  const router = useRouter();
  const copy = COPY[listingType];

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [foundLocation, setFoundLocation] = useState("");
  const [foundDate, setFoundDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dogName, setDogName] = useState("");
  const [breedGuess, setBreedGuess] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [hasCollar, setHasCollar] = useState(false);
  const [collarTagInfo, setCollarTagInfo] = useState("");
  const [temperament, setTemperament] = useState("");
  const [holdingStatus, setHoldingStatus] = useState("holding");
  const [notes, setNotes] = useState("");
  const [finderEmail, setFinderEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectSuggestion(suggestion: LocationSuggestion) {
    setLocation({ lat: suggestion.lat, lng: suggestion.lng });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photoUrl) return setError("Please add a photo of the dog.");
    if (listingType === "lost" && !dogName.trim())
      return setError("Please enter your dog's name.");
    if (!foundLocation.trim()) return setError("Please describe the location.");
    if (!location)
      return setError(
        "Please pick a location from the suggestions, or click the map to place a pin."
      );

    setSubmitting(true);
    try {
      const res = await fetch("/api/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType,
          dogName: dogName || undefined,
          photoUrl,
          foundLat: location.lat,
          foundLng: location.lng,
          foundLocation,
          foundDate,
          breedGuess: breedGuess || undefined,
          size: size || undefined,
          color: color || undefined,
          hasCollar,
          collarTagInfo: collarTagInfo || undefined,
          temperament: temperament || undefined,
          holdingStatus: listingType === "found" ? holdingStatus : undefined,
          notes: notes || undefined,
          finderEmail,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      router.push(`/dogs/${data.id}?posted=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold">{copy.heading}</h1>
      <p className="mb-6 text-sm text-black/60">{copy.intro}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">{copy.photoLabel}</label>
          <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
        </div>

        {listingType === "lost" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Your dog&apos;s name</label>
            <input
              type="text"
              required
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="e.g. Max"
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">
            {copy.locationLabel}
          </label>
          <LocationAutocomplete
            id="location"
            value={foundLocation}
            onChangeText={setFoundLocation}
            onSelect={handleSelectSuggestion}
            placeholder={copy.locationPlaceholder}
          />
          <p className="mt-1 text-xs text-black/50">
            Start typing an address or landmark and pick a match. Can&apos;t find the exact
            spot? Click directly on the map below to place or adjust the pin.
          </p>
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
            <label className="mb-1 block text-sm font-medium">{copy.dateLabel}</label>
            <input
              type="date"
              required
              value={foundDate}
              onChange={(e) => setFoundDate(e.target.value)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
          </div>
          {listingType === "found" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Is the dog currently...
              </label>
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
              placeholder="e.g. Lab mix"
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
            placeholder="e.g. black and white"
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
            <label className="mb-1 block text-sm font-medium">
              Collar/tag details (don&apos;t worry, we&apos;ll only share this with verified{" "}
              {listingType === "lost" ? "finders" : "claimants"})
            </label>
            <input
              type="text"
              value={collarTagInfo}
              onChange={(e) => setCollarTagInfo(e.target.value)}
              placeholder="e.g. Red collar, tag says 'Max'"
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
            placeholder="e.g. Friendly, a bit skittish"
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

        <div>
          <label className="mb-1 block text-sm font-medium">Your email</label>
          <input
            type="email"
            required
            value={finderEmail}
            onChange={(e) => setFinderEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-black/50">
            Never shown publicly. Used only to notify you of{" "}
            {listingType === "lost" ? "sightings" : "claims"} and to send you a private link
            to manage this listing.
          </p>
        </div>

        {/* Honeypot field, hidden from real users via CSS */}
        <div className="hidden" aria-hidden="true">
          <label>Website</label>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? copy.submittingLabel : copy.submitLabel}
        </button>
      </form>
    </div>
  );
}
