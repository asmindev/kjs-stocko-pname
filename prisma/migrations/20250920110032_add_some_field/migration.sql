-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "uom_name" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Product_id_seq";
