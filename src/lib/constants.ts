// Stockton, CA center point and a bounding box loose enough to cover the
// metro area (Lodi to Manteca) so pin-dropping stays roughly local.
export const STOCKTON_CENTER: [number, number] = [37.9577, -121.2908];
export const STOCKTON_BOUNDS: [[number, number], [number, number]] = [
  [37.75, -121.55],
  [38.15, -121.05],
];

export const DOG_SIZES = ["small", "medium", "large"] as const;
export const HOLDING_STATUSES = ["holding", "still_loose", "taken_to_shelter"] as const;

export const LISTING_LIFETIME_DAYS = 30;
