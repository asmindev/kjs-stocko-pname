-- CreateTable
CREATE TABLE "public"."odoo_sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odoo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "odoo_sessions_userId_idx" ON "public"."odoo_sessions"("userId");

-- CreateIndex
CREATE INDEX "odoo_sessions_expiresAt_idx" ON "public"."odoo_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."odoo_sessions" ADD CONSTRAINT "odoo_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
