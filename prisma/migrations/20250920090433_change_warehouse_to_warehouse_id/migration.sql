/*
  Warnings:

  - You are about to drop the column `warehouse` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "warehouse",
ADD COLUMN     "warehouse_id" INTEGER;
