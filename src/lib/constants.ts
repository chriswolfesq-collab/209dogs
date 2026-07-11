// The 209 area code region: San Joaquin, Stanislaus, and Merced counties
// plus the Tuolumne/Calaveras/Amador/Mariposa foothills. The bounds keep
// pin-dropping and map panning roughly within the region (Dos Palos to
// Jackson, Mountain House to Yosemite Valley).
export const REGION_CENTER: [number, number] = [37.7, -120.7];
export const REGION_BOUNDS: [[number, number], [number, number]] = [
  [36.85, -121.65],
  [38.55, -119.45],
];
// minLon,minLat,maxLon,maxLat — same area as REGION_BOUNDS, reformatted
// for geocoder APIs (Photon) that expect a flat bbox string.
export const REGION_BBOX = `${REGION_BOUNDS[0][1]},${REGION_BOUNDS[0][0]},${REGION_BOUNDS[1][1]},${REGION_BOUNDS[1][0]}`;
// Region-scale default: shows the whole 209 in one view.
export const REGION_DEFAULT_ZOOM = 9;

export const LISTING_TYPES = ["found", "lost"] as const;

export const DOG_SIZES = ["small", "medium", "large"] as const;
export const HOLDING_STATUSES = ["holding", "still_loose", "taken_to_shelter"] as const;

export const LISTING_LIFETIME_DAYS = 30;

// Proximity matching (src/lib/matching.ts): how close in space/time a lost
// and a found report need to be to notify both sides of a possible match.
export const MATCH_RADIUS_KM = 5;
export const MATCH_DATE_WINDOW_DAYS = 14;
export const MATCH_MAX_RESULTS = 5;
