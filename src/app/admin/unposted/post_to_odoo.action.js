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

export const actionPostToOdoo = async ({ data, isDailyOpname = false }) => {
    console.log("Starting actionPostToOdoo with data length:", data.length);
    console.log("Is Daily Opname:", isDailyOpname);

    // Parse environment variable with fallback to 500
    const MAX_LINES =
        parseInt(process.env.ODOO_MAX_POST_LINES_INVENTORY) || 500;

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
        let inventoryName = generateInventoryName(warehouse.code);

        // Custom name for Daily Opname
        if (isDailyOpname) {
            const now = new Date();
            const d = String(now.getDate()).padStart(2, "0");
            const m = String(now.getMonth() + 1).padStart(2, "0");
            const y = String(now.getFullYear()).slice(-2);
            const H = String(now.getHours()).padStart(2, "0");
            const M = String(now.getMinutes()).padStart(2, "0");
            inventoryName = `Cycle Count ${d}/${m}/${y}-${H}${M} (${warehouse.code})`;
        }

        // Get date from last item in data or current time
        const now = new Date();
        const date = now.toISOString().slice(0, 19).replace("T", " ");

        // Process all product items
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
            line_ids: LINE_IDS,
            is_daily_opname: isDailyOpname, // Send flag to Odoo
        };

        // Create inventory adjustment in Odoo
        const odooResult = await createInventoryAdjustment(odoo, inventoryData);

        // Extract success, error, and skipped product IDs from Odoo response
        const successProductIds = odooResult.data?.success || [];
        const errorProductIds = odooResult.data?.error || [];
        const skippedProductIds = odooResult.data?.skipped || [];

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
    } catch (error) {
        console.error("Error in actionPostToOdoo:", error);
        return {
            success: false,
            message: error.message || "Terjadi kesalahan internal",
            results,
        };
    }
};

export const actionBatchPostToOdoo = async ({ warehouseId }) => {
    console.log("Starting Batch Post for warehouse:", warehouseId);

    // 1. Fetch ALL unposted products
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

    return await actionPostToOdoo({ data: dataToPost, isDailyOpname: false });
};

/**
 * Batch Post for Daily Opname (Cycle Count)
 * NOW: Same as regular batch but sets isDailyOpname=true
 */
export const actionBatchDailyPostToOdoo = async ({ warehouseId }) => {
    console.log("Starting Daily Batch Post for warehouse:", warehouseId);

    // 1. Fetch ALL unposted products
    const allData = await fetchAndGroupUnpostedProducts({ warehouseId });

    if (!allData || allData.length === 0) {
        return {
            success: false,
            message: "Tidak ada data unposted untuk warehouse ini.",
        };
    }

    // 2. Limit to MAX_LINES (standard limit applies)
    const MAX_LINES =
        parseInt(process.env.ODOO_MAX_POST_LINES_INVENTORY) || 500;
    const dataToPost = allData.slice(0, MAX_LINES);

    // 3. Call actionPostToOdoo with isDailyOpname=true
    return await actionPostToOdoo({ data: dataToPost, isDailyOpname: true });
};
