-- CreateTable
CREATE TABLE "public"."verification_results" (
    "id" SERIAL NOT NULL,
    "odoo_line_id" INTEGER NOT NULL,
    "product_qty" DOUBLE PRECISION NOT NULL,
    "location_id" INTEGER NOT NULL,
    "verifier_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_odoo_line_id_key" ON "public"."verification_results"("odoo_line_id");
