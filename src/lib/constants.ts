// Stockton, CA center point and a bounding box loose enough to cover the
// metro area (Lodi to Manteca) so pin-dropping stays roughly local.
export const STOCKTON_CENTER: [number, number] = [37.9577, -121.2908];
export const STOCKTON_BOUNDS: [[number, number], [number, number]] = [
  [37.75, -121.55],
  [38.15, -121.05],
];
// minLon,minLat,maxLon,maxLat — same area as STOCKTON_BOUNDS, reformatted
// for geocoder APIs (Photon) that expect a flat bbox string.
export const STOCKTON_BBOX = `${STOCKTON_BOUNDS[0][1]},${STOCKTON_BOUNDS[0][0]},${STOCKTON_BOUNDS[1][1]},${STOCKTON_BOUNDS[1][0]}`;

export const LISTING_TYPES = ["found", "lost"] as const;

export const DOG_SIZES = ["small", "medium", "large"] as const;
export const HOLDING_STATUSES = ["holding", "still_loose", "taken_to_shelter"] as const;

export const LISTING_LIFETIME_DAYS = 30;
