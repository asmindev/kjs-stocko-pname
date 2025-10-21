-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_session_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
