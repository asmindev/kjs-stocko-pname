/*
  Warnings:

  - You are about to drop the column `odoo_id` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "odoo_id",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "User_id_seq";
