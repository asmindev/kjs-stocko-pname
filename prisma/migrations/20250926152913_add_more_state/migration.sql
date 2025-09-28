-- CreateEnum
CREATE TYPE "public"."ProductState" AS ENUM ('DRAFT', 'POST', 'DONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SessionState" ADD VALUE 'CONFIRMED';
ALTER TYPE "public"."SessionState" ADD VALUE 'DONE';

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "state" "public"."ProductState" NOT NULL DEFAULT 'DRAFT';
