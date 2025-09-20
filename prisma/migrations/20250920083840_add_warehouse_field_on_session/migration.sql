/*
  Warnings:

  - Made the column `warehouse` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Session" ALTER COLUMN "warehouse" SET NOT NULL;
