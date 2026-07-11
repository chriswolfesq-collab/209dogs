import { describe, expect, it } from "vitest";
import { CITY_NAMES, nearestCity, resolveCity } from "@/lib/cities";

describe("nearestCity", () => {
  it("returns the city whose centroid is closest", () => {
    expect(nearestCity(37.6391, -120.9969)).toBe("Modesto");
    expect(nearestCity(37.9577, -121.2908)).toBe("Stockton");
  });

  it("maps rural coordinates to the nearest canonical town", () => {
    // A point in rural Calaveras County between Murphys and Angels Camp.
    expect(["Murphys", "Angels Camp"]).toContain(nearestCity(38.1, -120.5));
  });
});

describe("resolveCity", () => {
  it("prefers a canonical geocoder hint, case-insensitively", () => {
    // Coordinates are in Stockton, but the hint names Lodi.
    expect(resolveCity("Lodi", 37.9577, -121.2908)).toBe("Lodi");
    expect(resolveCity("lodi", 37.9577, -121.2908)).toBe("Lodi");
  });

  it("falls back to nearest centroid for non-canonical hints", () => {
    // French Camp is an unincorporated community between Stockton and
    // Lathrop — the hint isn't canonical, so the nearest centroid wins.
    expect(resolveCity("French Camp", 37.88, -121.28)).toBe("Lathrop");
  });

  it("falls back to nearest centroid when the hint is missing", () => {
    expect(resolveCity(undefined, 37.3022, -120.483)).toBe("Merced");
    expect(resolveCity(null, 37.4849, -119.9663)).toBe("Mariposa");
  });

  it("always returns a canonical city name", () => {
    expect(CITY_NAMES).toContain(resolveCity("Nowhereville", 38.0, -120.7));
  });
});
