-- CreateEnum
CREATE TYPE "ClaimKind" AS ENUM ('claim', 'tip');

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "kind" "ClaimKind" NOT NULL DEFAULT 'claim';
