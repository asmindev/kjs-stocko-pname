/*
  Warnings:

  - You are about to drop the column `state` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SessionState" AS ENUM ('DRAFT', 'POST');

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "state",
ADD COLUMN     "session_id" INTEGER;

-- DropEnum
DROP TYPE "public"."ProductState";

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" "public"."SessionState" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
