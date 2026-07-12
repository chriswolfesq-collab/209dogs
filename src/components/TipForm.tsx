"use client";

import { useState } from "react";

type Props = {
  dogId: string;
  listingType: string;
  dogName?: string | null;
};

export default function TipForm({ dogId, listingType, dogName }: Props) {
  const isLost = listingType === "lost";
  const recipient = isLost ? "owner" : "finder";
  const toggleLabel = isLost
    ? "Haven't seen the dog, but have information? Send a tip instead"
    : "Not your dog, but have information? Send a tip instead";
  const heading = isLost
    ? `Have information for ${dogName ? `${dogName}'s owner` : "the owner"}?`
    : "Know something about this dog?";
  const intro = isLost
    ? "You don't need to have spotted the dog — if you know something that could help (a shelter to check, someone who may have taken it in, etc.), send a tip and the owner will get it by email."
    : "Not your dog, but you have useful info (you've seen it before, you know the owner, etc.)? Send a tip and the finder will get it by email.";

  const [open, setOpen] = useState(false);
  const [claimantName, setClaimantName] = useState("");
  const [claimantContact, setClaimantContact] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({
          kind: "tip",
          claimantName,
          claimantContact,
          proofAnswer: message,
          website,
        }),
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
        Thanks! Your tip was sent to the {recipient}.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-black/60 underline underline-offset-2 hover:text-black"
      >
        {toggleLabel}
      </button>
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
          placeholder={`In case the ${recipient} wants to follow up`}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Your tip</label>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Anything that could help the ${recipient}.`}
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send Tip"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
