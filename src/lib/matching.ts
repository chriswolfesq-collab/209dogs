import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { MATCH_RADIUS_KM, MATCH_DATE_WINDOW_DAYS, MATCH_MAX_RESULTS } from "@/lib/constants";

export type MatchCandidate = {
  id: string;
  dogName: string | null;
  breedGuess: string | null;
  foundLocation: string;
  finderEmail: string;
  distanceKm: number;
};

/**
 * Finds active opposite-type listings (lost <-> found) near a given dog in
 * both space and time, so a lost-dog report and a found-dog report of the
 * same animal can surface each other automatically.
 *
 * Filters with a lat/lng bounding box in the DB query first (cheap index
 * use), then refines with actual haversine distance in JS, since degrees of
 * latitude/longitude aren't equal real-world distances.
 */
export async function findPotentialMatches(dog: {
  id: string;
  listingType: string;
  foundLat: number;
  foundLng: number;
  foundDate: Date;
}): Promise<MatchCandidate[]> {
  const oppositeType = dog.listingType === "lost" ? "found" : "lost";

  const latDelta = MATCH_RADIUS_KM / 111; // ~111km per degree of latitude
  const lngDelta =
    MATCH_RADIUS_KM / (111 * Math.cos((dog.foundLat * Math.PI) / 180));

  const dateFrom = new Date(
    dog.foundDate.getTime() - MATCH_DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  const dateTo = new Date(
    dog.foundDate.getTime() + MATCH_DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const candidates = await prisma.dog.findMany({
    where: {
      id: { not: dog.id },
      listingType: oppositeType,
      status: { in: ["active", "claim_pending"] },
      expiresAt: { gt: new Date() },
      foundLat: { gte: dog.foundLat - latDelta, lte: dog.foundLat + latDelta },
      foundLng: { gte: dog.foundLng - lngDelta, lte: dog.foundLng + lngDelta },
      foundDate: { gte: dateFrom, lte: dateTo },
    },
    select: {
      id: true,
      dogName: true,
      breedGuess: true,
      foundLocation: true,
      foundLat: true,
      foundLng: true,
      finderEmail: true,
    },
  });

  return candidates
    .map((c) => ({
      id: c.id,
      dogName: c.dogName,
      breedGuess: c.breedGuess,
      foundLocation: c.foundLocation,
      finderEmail: c.finderEmail,
      distanceKm: haversineDistanceKm(dog.foundLat, dog.foundLng, c.foundLat, c.foundLng),
    }))
    .filter((c) => c.distanceKm <= MATCH_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MATCH_MAX_RESULTS);
}
