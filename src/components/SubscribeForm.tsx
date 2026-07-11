"use client";

import { useState } from "react";
import { REGION_CITIES, REGION_COUNTIES } from "@/lib/cities";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  // Empty selection = alerts for the whole 209.
  const [cities, setCities] = useState<string[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleCity(name: string) {
    setCities((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cities, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-black/60">
        Almost done — check your email and click the confirmation link. 🐾
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="subscribe-email" className="text-sm text-black/70">
          Get emailed when a new dog is posted in
        </label>
        <button
          type="button"
          onClick={() => setShowCities((v) => !v)}
          className="text-sm text-black/70 underline hover:text-black"
          aria-expanded={showCities}
        >
          {cities.length === 0
            ? "the whole 209"
            : cities.length <= 2
              ? cities.join(" & ")
              : `${cities.length} cities`}{" "}
          ▾
        </button>
        <input
          id="subscribe-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-56 rounded border border-black/20 px-2 py-1 text-sm"
        />
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={status === "busy"}
          className="rounded-md bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {status === "busy" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {showCities && (
        <div className="rounded-md border border-black/10 bg-neutral-50 p-3">
          <p className="mb-2 text-xs text-black/50">
            Pick the cities you care about, or leave them all unchecked to get every
            alert in the 209.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REGION_COUNTIES.map((county) => (
              <div key={county}>
                <div className="mb-1 text-xs font-medium text-black/60">
                  {county} County
                </div>
                {REGION_CITIES.filter((c) => c.county === county).map((c) => (
                  <label key={c.name} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={cities.includes(c.name)}
                      onChange={() => toggleCity(c.name)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
