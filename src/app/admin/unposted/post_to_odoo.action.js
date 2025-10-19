"use server";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";

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
 * Process a single product item to create line data
 */
async function processProductItem(item, odoo, stockLocationId, results) {
    const product_id = item.key.split("-")[1];

    try {
        // Get product from Odoo
        const [product] = await odoo.client.searchRead(
            "product.product",
            [["product_tmpl_id", "=", parseInt(product_id)]],
            { fields: ["id", "name"] }
        );

        if (!product) {
            results.error.push({
                product_id: parseInt(product_id),
                error: "Product tidak ditemukan di Odoo",
            });
            return null;
        }

        // Get stock quant data
        const quant = await odoo.client.searchRead(
            "stock.quant",
            [
                ["product_id", "=", product.id],
                ["location_id", "=", stockLocationId],
            ],
            { fields: ["id", "qty"] }
        );

        let STOCK_QUANT_QTY = 0;
        // jika ada stock quant, total qty di lokasi tersebut
        if (quant && quant.length > 0) {
            STOCK_QUANT_QTY = quant.reduce((sum, q) => sum + q.qty, 0);
        }
        console.log(
            `Stock quant untuk product ${product.name} (${product_id}) di lokasi ${stockLocationId}: ${STOCK_QUANT_QTY}`
        );

        // Create line data
        const lineData = {
            product_tmpl_id: parseInt(product_id),
            product_id: product.id,
            product_uom_id: item.originalUom.id,
            product_qty: item.quantity,
            location_id: stockLocationId,
            diff_qty: STOCK_QUANT_QTY - item.qty,
        };

        results.success.push({
            product_id: parseInt(product_id),
            message: "Berhasil diproses",
        });

        return [0, 0, lineData];
    } catch (error) {
        console.log(`Error processing product ${product_id}:`, error);
        results.error.push({
            product_id: parseInt(product_id),
            error: error.message || "Unknown error",
        });
        return null;
    }
}

/**
 * Process all product items to create LINE_IDS
 */
async function processProductItems(data, odoo, stockLocationId, results) {
    const LINE_IDS = [];

    for (const item of data) {
        const lineData = await processProductItem(
            item,
            odoo,
            stockLocationId,
            results
        );
        if (lineData) {
            LINE_IDS.push(lineData);
        }
    }

    return LINE_IDS;
}

/**
 * Create inventory adjustment in Odoo
 */
async function createInventoryAdjustment(odoo, inventoryData) {
    const MODELS = "custom.stock.inventory";
    const METHOD = "prepare_inventory";

    try {
        const inventory = await odoo.client.create(MODELS, inventoryData);
        await odoo.client.execute(MODELS, METHOD, [inventory]);
        return inventory;
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
 */
async function updateProductStates(productIds, documentId) {
    try {
        await prisma.product.updateMany({
            where: {
                product_id: { in: productIds },
                state: "CONFIRMED",
            },
            data: {
                document_id: documentId,
                state: "POST",
            },
        });
    } catch (error) {
        // Log error but don't fail the entire process since Odoo inventory was already created
        console.error("Error updating product states:", error);
    }
}

export const actionPostToOdoo = async ({ data }) => {
    console.log("Starting actionPostToOdoo with data length:", data.length);
    const MAX_LINES = process.env.ODOO_MAX_POST_LINES_INVENTORY;
    console.log("MAX LINES TO POST:", MAX_LINES);

    // Track results for detailed error reporting
    const results = {
        success: [],
        error: [],
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

        // Process all product items
        const LINE_IDS = await processProductItems(
            data,
            odoo,
            stockLocationId,
            results
        );

        if (LINE_IDS.length === 0) {
            return {
                success: false,
                error: "Tidak ada produk valid untuk dipost",
                results,
                details: `Total produk diproses: ${data.length}, Berhasil: ${results.success.length}, Gagal: ${results.error.length}`,
            };
        }

        // Prepare inventory data
        const inventoryData = {
            name: inventoryName,
            location_id: stockLocationId,
            filter: "partial",
            date,
            accounting_date: date,
            line_ids: LINE_IDS,
        };

        // Create inventory adjustment in Odoo
        const inventory = await createInventoryAdjustment(odoo, inventoryData);

        // Create document record in database
        const documentData = {
            name: inventoryName,
            warehouse_id: warehouseId,
            warehouse_name: warehouse.name,
            inventory_id: inventory,
            state: "POST",
            userId: parseInt(session.user.id),
        };
        const document = await createDocumentRecord(documentData);

        // Update product states
        const productIds = LINE_IDS.map((line) => line[2].product_tmpl_id);
        await updateProductStates(productIds, document.id);

        revalidatePath("/admin/unposted");

        return {
            success: true,
            message: `Berhasil posting ${document.name}`,
            results,
            details: `Total produk diproses: ${data.length}, Berhasil: ${results.success.length}, Gagal: ${results.error.length}`,
            inventoryId: inventory,
            documentId: document.id,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            results,
            details: `Total produk diproses: ${data.length}, Berhasil: ${results.success.length}, Gagal: ${results.error.length}`,
        };
    }
};
