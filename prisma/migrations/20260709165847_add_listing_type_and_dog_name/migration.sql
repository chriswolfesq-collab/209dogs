-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('found', 'lost');

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "dogName" TEXT,
ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'found';

-- CreateIndex
CREATE INDEX "Dog_listingType_idx" ON "Dog"("listingType");
