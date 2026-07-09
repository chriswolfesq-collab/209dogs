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

type Dog = DogSummary & Pick<DogPin, "foundLat" | "foundLng">;

export default function DogsPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.size) params.set("size", filters.size);
    if (filters.color) params.set("color", filters.color);
    if (filters.q) params.set("q", filters.q);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    return params.toString();
  }, [filters]);

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
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Found Dogs in Stockton</h1>
        <div className="flex rounded-lg border border-black/10 bg-white p-1">
          <button
            onClick={() => setView("map")}
            className={`rounded-md px-3 py-1 text-sm ${
              view === "map" ? "bg-neutral-900 text-white" : "text-black/60"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1 text-sm ${
              view === "list" ? "bg-neutral-900 text-white" : "text-black/60"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isPending && dogs.length === 0 ? (
        <p className="py-12 text-center text-black/40">Loading…</p>
      ) : view === "map" ? (
        <DogMap dogs={dogs} />
      ) : (
        <DogList dogs={dogs} />
      )}
    </div>
  );
}
