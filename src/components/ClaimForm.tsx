"use client";

import { useState } from "react";

export default function ClaimForm({ dogId }: { dogId: string }) {
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
        Thanks! We&apos;ve sent your info to the person who found this dog.
        They&apos;ll reach out to you directly if it&apos;s a match.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="font-semibold">Is this your dog?</h2>
      <p className="text-sm text-black/60">
        Fill this out and the finder will get your contact info by email so
        they can reach out. Their contact info stays private.
      </p>

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
          placeholder="So the finder can reach you"
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          How do you know this is your dog?
        </label>
        <textarea
          required
          rows={3}
          value={proofAnswer}
          onChange={(e) => setProofAnswer(e.target.value)}
          placeholder="Describe something specific: a scar, a behavior, what the collar tag says, etc. This helps the finder confirm it's really your dog."
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
        {submitting ? "Submitting…" : "Submit Claim"}
      </button>
    </form>
  );
}
