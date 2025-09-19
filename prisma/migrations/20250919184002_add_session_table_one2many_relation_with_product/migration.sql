/*
  Warnings:

  - You are about to drop the column `user_id` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "user_id",
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
