-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'active',
    "photoUrl" TEXT NOT NULL,
    "foundLat" REAL NOT NULL,
    "foundLng" REAL NOT NULL,
    "foundLocation" TEXT NOT NULL,
    "foundDate" DATETIME NOT NULL,
    "breedGuess" TEXT,
    "size" TEXT,
    "color" TEXT,
    "hasCollar" BOOLEAN NOT NULL DEFAULT false,
    "collarTagInfo" TEXT,
    "temperament" TEXT,
    "holdingStatus" TEXT NOT NULL DEFAULT 'holding',
    "notes" TEXT,
    "finderEmail" TEXT NOT NULL,
    "manageToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "claimantContact" TEXT NOT NULL,
    "proofAnswer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Claim_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DevEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Dog_manageToken_key" ON "Dog"("manageToken");

-- CreateIndex
CREATE INDEX "Dog_status_idx" ON "Dog"("status");

-- CreateIndex
CREATE INDEX "Claim_dogId_idx" ON "Claim"("dogId");
