"use client";

import { useState } from "react";

type Props = {
  dogId: string;
  listingType: string;
  dogName?: string | null;
};

export default function ClaimForm({ dogId, listingType, dogName }: Props) {
  const isLost = listingType === "lost";
  const heading = isLost ? `Have you seen ${dogName || "this dog"}?` : "Is this your dog?";
  const intro = isLost
    ? "Fill this out and the owner will get your contact info by email so they can follow up on the sighting. Their contact info stays private."
    : "Fill this out and the finder will get your contact info by email so they can reach out. Their contact info stays private.";
  const proofLabel = isLost
    ? "What did you see?"
    : "How do you know this is your dog?";
  const proofPlaceholder = isLost
    ? "Describe where and when you saw the dog, and anything distinctive you noticed."
    : "Describe something specific: a scar, a behavior, what the collar tag says, etc. This helps the finder confirm it's really your dog.";
  const submitLabel = isLost ? "Submit Sighting" : "Submit Claim";
  const submittedBody = isLost
    ? "Thanks! We've sent your sighting info to the dog's owner. They'll reach out to you directly if it helps."
    : "Thanks! We've sent your info to the person who found this dog. They'll reach out to you directly if it's a match.";

  const [claimantName, setClaimantName] = useState("");
  const [claimantContact, setClaimantContact] = useState("");
  const [proofAnswer, setProofAnswer] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dogs/${dogId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantName, claimantContact, proofAnswer, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        {submittedBody}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="font-semibold">{heading}</h2>
      <p className="text-sm text-black/60">{intro}</p>

      <div>
        <label className="mb-1 block text-sm font-medium">Your name</label>
        <input
          type="text"
          required
          value={claimantName}
          onChange={(e) => setClaimantName(e.target.value)}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Your phone or email</label>
        <input
          type="text"
          required
          value={claimantContact}
          onChange={(e) => setClaimantContact(e.target.value)}
          placeholder={isLost ? "So the owner can reach you" : "So the finder can reach you"}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{proofLabel}</label>
        <textarea
          required
          rows={3}
          value={proofAnswer}
          onChange={(e) => setProofAnswer(e.target.value)}
          placeholder={proofPlaceholder}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

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
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
