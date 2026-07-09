"use client";

export type Filters = {
  type: "" | "found" | "lost";
  size: string;
  color: string;
  q: string;
  dateFrom: string;
  dateTo: string;
  includeReunited: boolean;
};

export const EMPTY_FILTERS: Filters = {
  type: "",
  size: "",
  color: "",
  q: "",
  dateFrom: "",
  dateTo: "",
  includeReunited: false,
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export default function FilterBar({ filters, onChange }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== "includeReunited" && Boolean(value)
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3">
      <div className="flex rounded-lg border border-black/10 bg-neutral-50 p-1 self-start">
        {(["", "found", "lost"] as const).map((t) => (
          <button
            key={t || "all"}
            type="button"
            onClick={() => set("type", t)}
            className={`rounded-md px-3 py-1 text-sm ${
              filters.type === t ? "bg-neutral-900 text-white" : "text-black/60"
            }`}
          >
            {t === "" ? "All" : t === "found" ? "Found" : "Lost"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">Search location</label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="e.g. Louis Park, Miracle Mile"
            className="w-48 rounded border border-black/20 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">Size</label>
          <select
            value={filters.size}
            onChange={(e) => set("size", e.target.value)}
            className="rounded border border-black/20 px-2 py-1 text-sm"
          >
            <option value="">Any</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">Color</label>
          <input
            type="text"
            value={filters.color}
            onChange={(e) => set("color", e.target.value)}
            placeholder="e.g. brown"
            className="w-28 rounded border border-black/20 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">Date after</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="rounded border border-black/20 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">Date before</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className="rounded border border-black/20 px-2 py-1 text-sm"
          />
        </div>
        <label className="flex items-center gap-1.5 pb-1.5 text-sm text-black/70">
          <input
            type="checkbox"
            checked={filters.includeReunited}
            onChange={(e) => set("includeReunited", e.target.checked)}
          />
          Show reunited dogs 🎉
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS, includeReunited: filters.includeReunited })}
            className="text-sm text-black/60 underline hover:text-black"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
