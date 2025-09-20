/*
  Warnings:

  - You are about to drop the column `createdAt` on the `odoo_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `odoo_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `odoo_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionData` on the `odoo_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `odoo_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `odoo_sessions` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `odoo_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_data` to the `odoo_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `odoo_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `odoo_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."odoo_sessions" DROP CONSTRAINT "odoo_sessions_userId_fkey";

-- DropIndex
DROP INDEX "public"."odoo_sessions_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."odoo_sessions_userId_idx";

-- AlterTable
ALTER TABLE "public"."odoo_sessions" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "isActive",
DROP COLUMN "sessionData",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "session_data" JSONB NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "odoo_sessions_user_id_idx" ON "public"."odoo_sessions"("user_id");

-- CreateIndex
CREATE INDEX "odoo_sessions_expires_at_idx" ON "public"."odoo_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."odoo_sessions" ADD CONSTRAINT "odoo_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
