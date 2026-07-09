-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitHit_key_createdAt_idx" ON "RateLimitHit"("key", "createdAt");

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscriber" ADD COLUMN "confirmToken" TEXT;

-- Backfill: existing subscribers went through the old single-opt-in flow.
-- Grandfather them in as confirmed rather than silently cutting off their
-- alerts, and give them a random confirmToken to satisfy the NOT NULL/UNIQUE
-- constraint being added below.
UPDATE "Subscriber" SET "confirmed" = true, "confirmToken" = md5(random()::text || clock_timestamp()::text) WHERE "confirmToken" IS NULL;

ALTER TABLE "Subscriber" ALTER COLUMN "confirmToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_confirmToken_key" ON "Subscriber"("confirmToken");
