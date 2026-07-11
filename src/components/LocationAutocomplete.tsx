"use client";

import { useEffect, useRef, useState } from "react";
import { REGION_BBOX, REGION_CENTER } from "@/lib/constants";

export type LocationSuggestion = {
  label: string;
  lat: number;
  lng: number;
  // City name hint from the geocoder, if it returned one. Only a hint —
  // the server normalizes it against the canonical list (src/lib/cities.ts).
  city?: string;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

// When the user picks a city/town itself (typing just "Lodi"), Photon puts
// the name in properties.name with no properties.city — treat the place's
// own name as the city in that case.
function isPlaceFeature(p: PhotonFeature["properties"]) {
  return (
    p.osm_key === "place" &&
    ["city", "town", "village", "hamlet"].includes(p.osm_value ?? "")
  );
}

function formatSuggestion(feature: PhotonFeature): LocationSuggestion {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const streetLine = [p.housenumber, p.street].filter(Boolean).join(" ");
  const parts = [p.name, p.name ? streetLine || null : streetLine, p.city, p.state].filter(
    (part, i, arr) => Boolean(part) && arr.indexOf(part) === i
  );
  const city = p.city ?? (isPlaceFeature(p) ? p.name : undefined);
  return { label: parts.join(", "), lat, lng, city };
}

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  id?: string;
};

export default function LocationAutocomplete({
  value,
  onChangeText,
  onSelect,
  placeholder,
  id,
}: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (value.trim().length < 3) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: value,
          lat: String(REGION_CENTER[0]),
          lon: String(REGION_CENTER[1]),
          limit: "6",
          bbox: REGION_BBOX,
        });
        const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const results: LocationSuggestion[] = (data.features ?? []).map(formatSuggestion);
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlighted(-1);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(suggestion: LocationSuggestion) {
    skipNextFetch.current = true;
    onChangeText(suggestion.label);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (highlighted >= 0) {
        e.preventDefault();
        pick(suggestions[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const listboxId = `${id ?? "location"}-listbox`;

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        required
        autoComplete="off"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/40">
          Searching…
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-md border border-black/10 bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.lat},${s.lng},${i}`} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === highlighted ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
