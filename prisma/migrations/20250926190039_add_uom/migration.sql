-- CreateTable
CREATE TABLE "public"."UomCategory" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."uoms" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "uom_type" TEXT NOT NULL,
    "factor_inv" DOUBLE PRECISION,
    "factor" DOUBLE PRECISION,

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uoms_category_id_idx" ON "public"."uoms"("category_id");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."uoms" ADD CONSTRAINT "uoms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."UomCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
