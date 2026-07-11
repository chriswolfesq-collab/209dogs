// Relative import (not the @/ alias) so scripts/backfill-city.ts can run
// this file under npx tsx without tsconfig path resolution.
import { haversineDistanceKm } from "./geo";

// Canonical list of 209-area cities and towns, grouped by county. This is
// the single vocabulary shared by the browse filter, subscriber alert
// preferences, and the city stored on each listing — Photon's geocoder
// output is too inconsistent (missing city on rural pins, unincorporated
// community names) to use raw, so listings are always normalized to one of
// these names via resolveCity().
export type RegionCity = { name: string; county: string; lat: number; lng: number };

export const REGION_CITIES: RegionCity[] = [
  // San Joaquin County
  { name: "Stockton", county: "San Joaquin", lat: 37.9577, lng: -121.2908 },
  { name: "Lodi", county: "San Joaquin", lat: 38.1302, lng: -121.2724 },
  { name: "Tracy", county: "San Joaquin", lat: 37.7397, lng: -121.4252 },
  { name: "Manteca", county: "San Joaquin", lat: 37.7974, lng: -121.2161 },
  { name: "Lathrop", county: "San Joaquin", lat: 37.8227, lng: -121.2766 },
  { name: "Ripon", county: "San Joaquin", lat: 37.7397, lng: -121.1355 },
  { name: "Escalon", county: "San Joaquin", lat: 37.7938, lng: -120.9966 },
  { name: "Mountain House", county: "San Joaquin", lat: 37.7834, lng: -121.5427 },
  // Stanislaus County
  { name: "Modesto", county: "Stanislaus", lat: 37.6391, lng: -120.9969 },
  { name: "Turlock", county: "Stanislaus", lat: 37.4947, lng: -120.8466 },
  { name: "Ceres", county: "Stanislaus", lat: 37.5949, lng: -120.9577 },
  { name: "Riverbank", county: "Stanislaus", lat: 37.736, lng: -120.9355 },
  { name: "Oakdale", county: "Stanislaus", lat: 37.7666, lng: -120.8472 },
  { name: "Patterson", county: "Stanislaus", lat: 37.4716, lng: -121.1297 },
  { name: "Newman", county: "Stanislaus", lat: 37.3138, lng: -121.0208 },
  { name: "Hughson", county: "Stanislaus", lat: 37.6027, lng: -120.866 },
  { name: "Waterford", county: "Stanislaus", lat: 37.6413, lng: -120.7605 },
  // Merced County
  { name: "Merced", county: "Merced", lat: 37.3022, lng: -120.483 },
  { name: "Los Banos", county: "Merced", lat: 37.0583, lng: -120.8499 },
  { name: "Atwater", county: "Merced", lat: 37.3477, lng: -120.6091 },
  { name: "Livingston", county: "Merced", lat: 37.3869, lng: -120.7235 },
  { name: "Gustine", county: "Merced", lat: 37.2577, lng: -120.9988 },
  { name: "Dos Palos", county: "Merced", lat: 36.9861, lng: -120.6266 },
  { name: "Delhi", county: "Merced", lat: 37.4322, lng: -120.7785 },
  // Tuolumne County
  { name: "Sonora", county: "Tuolumne", lat: 37.9841, lng: -120.3822 },
  { name: "Jamestown", county: "Tuolumne", lat: 37.9533, lng: -120.4227 },
  { name: "Twain Harte", county: "Tuolumne", lat: 38.0396, lng: -120.2327 },
  { name: "Groveland", county: "Tuolumne", lat: 37.8385, lng: -120.2321 },
  // Calaveras County
  { name: "Angels Camp", county: "Calaveras", lat: 38.0678, lng: -120.5391 },
  { name: "Murphys", county: "Calaveras", lat: 38.1377, lng: -120.461 },
  { name: "Arnold", county: "Calaveras", lat: 38.2555, lng: -120.351 },
  { name: "San Andreas", county: "Calaveras", lat: 38.196, lng: -120.6805 },
  { name: "Valley Springs", county: "Calaveras", lat: 38.1916, lng: -120.8291 },
  { name: "Copperopolis", county: "Calaveras", lat: 37.981, lng: -120.6427 },
  // Amador County
  { name: "Jackson", county: "Amador", lat: 38.3488, lng: -120.7741 },
  { name: "Sutter Creek", county: "Amador", lat: 38.393, lng: -120.8027 },
  { name: "Ione", county: "Amador", lat: 38.3527, lng: -120.9327 },
  { name: "Plymouth", county: "Amador", lat: 38.4816, lng: -120.8446 },
  { name: "Pioneer", county: "Amador", lat: 38.4319, lng: -120.5716 },
  // Mariposa County
  { name: "Mariposa", county: "Mariposa", lat: 37.4849, lng: -119.9663 },
  { name: "Coulterville", county: "Mariposa", lat: 37.7105, lng: -120.1963 },
  { name: "El Portal", county: "Mariposa", lat: 37.6741, lng: -119.7818 },
];

export const CITY_NAMES = REGION_CITIES.map((c) => c.name) as [string, ...string[]];

export const REGION_COUNTIES = [...new Set(REGION_CITIES.map((c) => c.county))];

// The handful of larger cities shown in the browse filter dropdown — the
// full REGION_CITIES list (~40 towns) is still used for geocoding/city
// resolution and subscriber alert prefs, just not as filter options.
const MAJOR_CITY_NAMES = ["Stockton", "Modesto", "Merced", "Tracy", "Turlock", "Manteca", "Lodi"];

export const MAJOR_CITIES = REGION_CITIES.filter((c) => MAJOR_CITY_NAMES.includes(c.name));

const CITY_BY_LOWER_NAME = new Map(REGION_CITIES.map((c) => [c.name.toLowerCase(), c.name]));

export function nearestCity(lat: number, lng: number): string {
  let best = REGION_CITIES[0];
  let bestDistance = Infinity;
  for (const city of REGION_CITIES) {
    const distance = haversineDistanceKm(lat, lng, city.lat, city.lng);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }
  return best.name;
}

// The geocoder's city hint wins when it names a canonical city; anything
// else (missing, unincorporated community, misspelling) falls back to the
// nearest canonical city by centroid distance.
export function resolveCity(
  cityHint: string | undefined | null,
  lat: number,
  lng: number
): string {
  const canonical = cityHint ? CITY_BY_LOWER_NAME.get(cityHint.trim().toLowerCase()) : undefined;
  return canonical ?? nearestCity(lat, lng);
}
