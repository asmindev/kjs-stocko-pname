/*
  Warnings:

  - You are about to drop the `UomCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."uoms" DROP CONSTRAINT "uoms_category_id_fkey";

-- DropTable
DROP TABLE "public"."UomCategory";

-- CreateTable
CREATE TABLE "public"."uom_categories" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "uom_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."uoms" ADD CONSTRAINT "uoms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."uom_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
