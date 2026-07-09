-- CreateEnum
CREATE TYPE "DogStatus" AS ENUM ('active', 'claim_pending', 'resolved', 'expired');

-- CreateEnum
CREATE TYPE "HoldingStatus" AS ENUM ('holding', 'still_loose', 'taken_to_shelter');

-- CreateEnum
CREATE TYPE "DogSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('new', 'finder_contacted', 'rejected');

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "status" "DogStatus" NOT NULL DEFAULT 'active',
    "photoUrl" TEXT NOT NULL,
    "foundLat" DOUBLE PRECISION NOT NULL,
    "foundLng" DOUBLE PRECISION NOT NULL,
    "foundLocation" TEXT NOT NULL,
    "foundDate" TIMESTAMP(3) NOT NULL,
    "breedGuess" TEXT,
    "size" "DogSize",
    "color" TEXT,
    "hasCollar" BOOLEAN NOT NULL DEFAULT false,
    "collarTagInfo" TEXT,
    "temperament" TEXT,
    "holdingStatus" "HoldingStatus" NOT NULL DEFAULT 'holding',
    "notes" TEXT,
    "finderEmail" TEXT NOT NULL,
    "manageToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "claimantContact" TEXT NOT NULL,
    "proofAnswer" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dog_manageToken_key" ON "Dog"("manageToken");

-- CreateIndex
CREATE INDEX "Dog_status_idx" ON "Dog"("status");

-- CreateIndex
CREATE INDEX "Claim_dogId_idx" ON "Claim"("dogId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
