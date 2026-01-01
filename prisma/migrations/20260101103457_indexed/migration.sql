-- CreateIndex
CREATE INDEX "Document_created_at_idx" ON "public"."Document"("created_at");

-- CreateIndex
CREATE INDEX "Product_state_idx" ON "public"."Product"("state");

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "public"."Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_session_id_idx" ON "public"."Product"("session_id");

-- CreateIndex
CREATE INDEX "Product_created_at_idx" ON "public"."Product"("created_at");

-- CreateIndex
CREATE INDEX "Product_product_id_idx" ON "public"."Product"("product_id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "public"."Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_created_at_idx" ON "public"."Session"("created_at");
