"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import DogList from "@/components/DogList";
import FilterBar, { EMPTY_FILTERS, Filters } from "@/components/FilterBar";
import type { DogSummary } from "@/components/DogCard";
import type { DogPin } from "@/components/DogMap";

const DogMap = dynamic(() => import("@/components/DogMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-lg border border-black/10 bg-neutral-100 text-black/40">
      Loading map…
    </div>
  ),
});

type Dog = DogSummary & Pick<DogPin, "foundLat" | "foundLng"> & { listingType: string };
type ViewMode = "split" | "map" | "list";

// Debounces just the free-text fields so typing doesn't fire a fetch per
// keystroke; button/select filters still apply immediately.
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function DogsPage() {
  const [view, setView] = useState<ViewMode>("split");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const debouncedQ = useDebounced(filters.q, 300);
  const debouncedColor = useDebounced(filters.color, 300);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.size) params.set("size", filters.size);
    if (debouncedColor) params.set("color", debouncedColor);
    if (debouncedQ) params.set("q", debouncedQ);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.includeReunited) params.set("includeReunited", "1");
    if (filters.sort) params.set("sort", filters.sort);
    return params.toString();
  }, [filters, debouncedQ, debouncedColor]);

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/dogs${queryString ? `?${queryString}` : ""}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load dogs");
        if (!cancelled) {
          setDogs(data.dogs);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dogs");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [queryString, startTransition]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lost &amp; Found Dogs in Stockton, CA</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-black/10 bg-white p-1">
            {(["split", "map", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-sm capitalize ${
                  view === v ? "bg-neutral-900 text-white" : "text-black/60"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isPending && dogs.length === 0 ? (
        <p className="py-12 text-center text-black/40">Loading…</p>
      ) : view === "map" ? (
        <DogMap dogs={dogs} showLegend />
      ) : view === "list" ? (
        <DogList dogs={dogs} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <DogList
              dogs={dogs}
              columns={2}
              activeId={hoveredId}
              onHoverDog={setHoveredId}
            />
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <DogMap dogs={dogs} height="70vh" showLegend highlightId={hoveredId} />
          </div>
        </div>
      )}
    </div>
  );
}
