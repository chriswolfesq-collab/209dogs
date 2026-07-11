-- Additive, online-safe: nullable Dog.city (backfilled by
-- scripts/backfill-city.ts) and Subscriber.cities defaulting to {} ("all
-- cities"), which is the correct backward-compat meaning for existing rows.
ALTER TABLE "Dog" ADD COLUMN "city" TEXT;

CREATE INDEX "Dog_city_idx" ON "Dog"("city");

ALTER TABLE "Subscriber" ADD COLUMN "cities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
