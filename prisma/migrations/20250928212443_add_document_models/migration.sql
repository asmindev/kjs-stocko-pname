/*
  Warnings:

  - You are about to drop the column `documentId` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DocumentState" AS ENUM ('POST', 'DONE');

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_documentId_fkey";

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "state" "public"."DocumentState" NOT NULL DEFAULT 'POST',
ADD COLUMN     "warehouse_id" INTEGER,
ADD COLUMN     "warehouse_name" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "documentId",
ADD COLUMN     "document_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
