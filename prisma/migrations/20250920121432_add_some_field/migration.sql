-- AlterTable
CREATE SEQUENCE "public".product_id_seq;
ALTER TABLE "public"."Product" ADD COLUMN     "product_id" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('"public".product_id_seq');
ALTER SEQUENCE "public".product_id_seq OWNED BY "public"."Product"."id";
