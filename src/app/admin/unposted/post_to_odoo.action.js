"use server";
import { fetchAndGroupUnpostedProducts } from "./actions";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";

export const getMaxPostLines = async () => {
    return parseInt(process.env.ODOO_MAX_POST_LINES_INVENTORY) || 500;
};

/**
 * Get warehouse data from Odoo
 */
async function getWarehouseData(odoo, warehouseId) {
    try {
        const [warehouse] = await odoo.client.searchRead(
            "stock.warehouse",
            [["lot_stock_id", "=", warehouseId]],
            { fields: ["code", "name", "lot_stock_id"] }
        );

        if (!warehouse) {
            throw new Error(
                `Warehouse dengan ID ${warehouseId} tidak ditemukan`
            );
        }

        return warehouse;
    } catch (error) {
        throw new Error(`Gagal mengambil data warehouse: ${error.message}`);
    }
}

/**
 * Generate inventory name with format: "TKJS/DDMMYY-HHMM"
 */
function generateInventoryName(warehouseCode) {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${warehouseCode}/${day}${month}${year}-${hours}${minutes}`;
}

/**
 * Process all product items to create LINE_IDS
 * Ultra-optimized: Send raw data only, Python will handle everything
 */
function processProductItems(data, stockLocationId, results) {
    try {
        console.log(`Preparing ${data.length} products for bulk processing...`);

        // Build LINE_IDS with minimal data
        // Python will fetch variants, calculate diff_qty, and determine type
        const LINE_IDS = [];

        for (const item of data) {
            const product_tmpl_id = parseInt(item.product_id);

            // Ambil qty dari item.qty (bukan item.quantity)
            const qty = typeof item.qty === "number" ? item.qty : 0;

            // Create minimal line data - Python will handle the rest
            let UOM_ID = item.originalUom.id;
            if (item.needsConversion) {
                UOM_ID = item.targetUom.id;
            }
            const lineData = {
                product_tmpl_id: product_tmpl_id, // Send template ID only
                product_uom_id: UOM_ID,
                product_qty: qty, // Ambil dari item.qty
                location_id: stockLocationId,
            };

            LINE_IDS.push(lineData);

            results.success.push({
                product_id: product_tmpl_id,
                message: "Prepared for processing",
            });
        }

        console.log(`Prepared ${LINE_IDS.length} lines for bulk creation`);
        return LINE_IDS;
    } catch (error) {
        console.error("Error in preparing data:", error);
        throw error;
    }
}

/**
 * Create inventory adjustment in Odoo using bulk method
 * This method creates inventory header and all lines in one transaction
 */
async function createInventoryAdjustment(odoo, inventoryData) {
    const MODELS = "custom.stock.inventory";
    const METHOD = "create_bulk_inventory";

    try {
        // Use the new bulk creation method
        const result = await odoo.client.execute(MODELS, METHOD, [
            inventoryData,
        ]);

        if (!result.success) {
            throw new Error(result.message || "Bulk inventory creation failed");
        }

        console.log(
            `Bulk inventory created: ${result.name} with ${result.lines_count} lines`
        );
        return result;
    } catch (error) {
        throw new Error(
            `Gagal membuat inventory adjustment di Odoo: ${error.message}`
        );
    }
}

/**
 * Create document record in database
 */
async function createDocumentRecord(documentData) {
    try {
        const document = await prisma.document.create({
            data: documentData,
        });
        return document;
    } catch (error) {
        throw new Error(
            `Gagal menyimpan document ke database: ${error.message}`
        );
    }
}

/**
 * Update product states to POSTED
 * Only update products that were successfully processed in Odoo
 */
async function updateProductStates(successProductIds, documentId) {
    try {
        if (successProductIds.length === 0) {
            console.log("No successful products to update");
            return;
        }

        const updated = await prisma.product.updateMany({
            where: {
                product_id: { in: successProductIds },
                state: "CONFIRMED",
            },
            data: {
                document_id: documentId,
                state: "POST",
            },
        });

        console.log(`Updated ${updated.count} products to POST state`);
    } catch (error) {
        // Log error but don't fail the entire process since Odoo inventory was already created
        console.error("Error updating product states:", error);
    }
}

export const actionPostToOdoo = async ({ data }) => {
    console.log("Starting actionPostToOdoo with data length:", data.length);
    console.log("Data sample:", JSON.stringify(data.slice(0, 2), null, 2));

    // Parse environment variable with fallback to 500
    const MAX_LINES =
        parseInt(process.env.ODOO_MAX_POST_LINES_INVENTORY) || 500;
    console.log("MAX LINES TO POST:", MAX_LINES);
    console.log("ENV VALUE:", process.env.ODOO_MAX_POST_LINES_INVENTORY);

    // Track results for detailed error reporting
    const results = {
        success: [],
        error: [],
        skipped: [],
    };

    // Validation
    if (!Array.isArray(data)) {
        return {
            success: false,
            error: "Data should be an array",
            results,
        };
    }

    // Limit data if too many lines
    if (data.length > MAX_LINES) {
        data = data.slice(0, MAX_LINES);
    }

    try {
        // Get user session and Odoo client
        const session = await getServerSession(authOptions);
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // Get warehouse data
        const warehouseId = data[0].warehouseId;
        const warehouse = await getWarehouseData(odoo, warehouseId);
        const stockLocationId = warehouseId;

        // Generate inventory name
        const inventoryName = generateInventoryName(warehouse.code);

        // Get date from last item in data
        const lastItem = data[data.length - 1];
        const item = new Date(
            lastItem.details[lastItem.details.length - 1].created_at
        );
        const date = new Date(item)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

        // Process all product items (no async needed, no Odoo calls)
        const LINE_IDS = processProductItems(data, stockLocationId, results);

        if (LINE_IDS.length === 0) {
            return {
                success: false,
                error: "Tidak ada produk valid untuk dipost",
                results,
                details: `Total produk diproses: ${data.length}, Berhasil: ${results.success.length}, Gagal: ${results.error.length}`,
            };
        }

        // Prepare inventory data with lines
        const inventoryData = {
            name: inventoryName,
            location_id: stockLocationId,
            filter: "partial",
            date,
            accounting_date: date,
            line_ids: LINE_IDS, // Send lines directly, not wrapped in [0, 0, data]
        };

        // Create inventory adjustment in Odoo
        const odooResult = await createInventoryAdjustment(odoo, inventoryData);

        // Extract success, error, and skipped product IDs from Odoo response
        const successProductIds = odooResult.data?.success || [];
        const errorProductIds = odooResult.data?.error || [];
        const skippedProductIds = odooResult.data?.skipped || [];

        console.log(`Odoo processing results:
            Success: ${successProductIds.length}
            Error: ${errorProductIds.length}
            Skipped: ${skippedProductIds.length}`);

        // Create document record in database
        const documentData = {
            name: inventoryName,
            warehouse_id: warehouseId,
            warehouse_name: warehouse.name,
            inventory_id: odooResult.inventory_id,
            state: "POST",
            userId: parseInt(session.user.id),
        };
        const document = await createDocumentRecord(documentData);

        // Update product states - ONLY for successfully processed products
        await updateProductStates(successProductIds, document.id);

        revalidatePath("/admin/unposted");

        return {
            success: true,
            message: odooResult.message || `Berhasil posting ${document.name}`,
            inventoryId: odooResult.inventory_id,
            inventoryName: odooResult.name,
            linesCount: odooResult.lines_count,
            documentId: document.id,
            details: {
                totalProcessed: data.length,
                successCount: successProductIds.length,
                errorCount: errorProductIds.length,
                skippedCount: skippedProductIds.length,
                successProducts: successProductIds,
                errorProducts: errorProductIds,
                skippedProducts: skippedProductIds,
            },
        };
    } catch (error) {}
};

export const actionBatchPostToOdoo = async ({ warehouseId }) => {
    console.log("Starting Batch Post for warehouse:", warehouseId);

    // 1. Fetch ALL unposted products for the warehouse (grouped/flat)
    const allData = await fetchAndGroupUnpostedProducts({ warehouseId });

    if (!allData || allData.length === 0) {
        return {
            success: false,
            message: "Tidak ada data unposted untuk warehouse ini.",
        };
    }

    // 2. Limit to MAX_LINES
    const MAX_LINES =
        parseInt(process.env.ODOO_MAX_POST_LINES_INVENTORY) || 500;
    const dataToPost = allData.slice(0, MAX_LINES);

    console.log(
        `Found ${allData.length} items. Posting batch of ${dataToPost.length} items.`
    );

    // 3. Delegate to existing action logic
    // We can call actionPostToOdoo directly, passing the prepared data.
    // Note: actionPostToOdoo handles session auth again, which is fine.
    // However, actionPostToOdoo also slices data to 300. We should update actionPostToOdoo limit or just rely on it.
    // Let's modify actionPostToOdoo to accept a higher limit or respect input if possible.
    // Actually, actionPostToOdoo hardcodes MAX_LINES = 300. We should probably update that too or duplicate logic.
    // Better to update actionPostToOdoo to respect our slice, or increase its internal limit.

    // Let's call the reuseable logic. But wait, `actionPostToOdoo` is a server action.
    // We can call it as a function.

    // NOTE: We rely on actionPostToOdoo to handle the posting.
    // We previously saw actionPostToOdoo has `const MAX_LINES = 300;`.
    // We should update `actionPostToOdoo` to support 500 first.

    return await actionPostToOdoo({ data: dataToPost });
};
