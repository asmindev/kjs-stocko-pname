-- CreateEnum
CREATE TYPE "public"."SessionState" AS ENUM ('DRAFT', 'CONFIRMED', 'POST', 'DONE');

-- CreateEnum
CREATE TYPE "public"."ProductState" AS ENUM ('DRAFT', 'CONFIRMED', 'POST', 'DONE');

-- CreateEnum
CREATE TYPE "public"."DocumentState" AS ENUM ('POST', 'DONE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'checker',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."odoo_sessions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "session_data" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odoo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" "public"."SessionState" NOT NULL DEFAULT 'DRAFT',
    "warehouse_id" INTEGER,
    "warehouse_name" TEXT,
    "inventory_id" INTEGER,
    "user_id" INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
    "inventory_id" INTEGER,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouse_id" INTEGER,
    "warehouse_name" TEXT,
    "state" "public"."DocumentState" NOT NULL DEFAULT 'POST',
    "userId" INTEGER,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "barcode" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "uom_id" INTEGER,
    "uom_name" TEXT,
    "location_id" INTEGER,
    "location_name" TEXT,
    "state" "public"."ProductState" NOT NULL DEFAULT 'DRAFT',
    "session_id" INTEGER,
    "userId" INTEGER,
    "document_id" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."uom_categories" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "uom_categories_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "odoo_sessions_user_id_idx" ON "public"."odoo_sessions"("user_id");

-- CreateIndex
CREATE INDEX "odoo_sessions_expires_at_idx" ON "public"."odoo_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "uoms_category_id_idx" ON "public"."uoms"("category_id");

-- AddForeignKey
ALTER TABLE "public"."odoo_sessions" ADD CONSTRAINT "odoo_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."uoms" ADD CONSTRAINT "uoms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."uom_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
