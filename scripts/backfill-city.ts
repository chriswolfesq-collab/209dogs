// One-time backfill: derive Dog.city for rows created before the column
// existed, using nearest-centroid over the canonical 209 city list.
// Idempotent (only touches city: null rows). Run with:
//   npx tsx scripts/backfill-city.ts
import { PrismaClient } from "@prisma/client";
import { nearestCity } from "../src/lib/cities";

const prisma = new PrismaClient();

async function main() {
  const dogs = await prisma.dog.findMany({
    where: { city: null },
    select: { id: true, foundLat: true, foundLng: true },
  });
  console.log(`Backfilling city for ${dogs.length} listing(s)…`);

  for (const dog of dogs) {
    const city = nearestCity(dog.foundLat, dog.foundLng);
    await prisma.dog.update({ where: { id: dog.id }, data: { city } });
    console.log(`  ${dog.id} → ${city}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
