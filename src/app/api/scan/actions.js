import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";

// Fungsi untuk menggabungkan produk dengan barcode yang sama
const consolidateProductsByBarcode = (products) => {
    const productMap = new Map();

    for (const product of products) {
        const key = product.barcode;

        if (productMap.has(key)) {
            // Jika produk dengan barcode yang sama sudah ada, gabungkan quantity
            const existing = productMap.get(key);
            existing.quantity += product.quantity;
        } else {
            // Buat copy dari produk untuk menghindari mutasi data asli
            productMap.set(key, { ...product });
        }
    }

    return Array.from(productMap.values());
};

export const uploadToOdoo = async (sessionId) => {
    const MODELS = "custom.stock.inventory";
    const LINE_IDS = [];

    try {
        const session = await getServerSession(authOptions);

        // Implementasi logika untuk mengunggah data session ke Odoo
        // get session data from backend
        const result = await prisma.session.findUnique({
            where: { id: parseInt(sessionId) },
            include: { products: true },
        });
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const date = result.created_at
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

        // Gabungkan produk yang memiliki barcode sama
        const consolidatedProducts = consolidateProductsByBarcode(
            result.products
        );

        for (const item of consolidatedProducts) {
            try {
                // get product from odoo using product.product model (not product.template)
                // First, search for the product.product record that corresponds to the template
                const productIds = await odoo.client.search("product.product", [
                    ["product_tmpl_id", "=", item.product_id],
                ]);

                if (productIds.length === 0) {
                    continue;
                }

                // Use the first variant found (usually the main product)
                const productId = productIds[0];

                // get total quantity from odoo
                const [product] = await odoo.client.read(
                    "product.product",
                    productId,
                    ["qty_available"]
                );
                const data = {
                    product_id: productId,
                    product_uom_id: item.uom_id,
                    product_qty: item.quantity,
                    location_id: result.warehouse_id,
                    diff_qty: product.qty_available - item.quantity,
                };
                LINE_IDS.push([0, 0, data]);
            } catch (error) {
                continue;
            }
        }

        const FIELDS_INVENTORY_START = {
            name: result.name,
            location_id: result.warehouse_id,
            filter: "partial",
            write_uid: session.user.id,
            date,
            accounting_date: date,
            line_ids: LINE_IDS,
        };

        const inventory = await odoo.client.create(
            MODELS,
            FIELDS_INVENTORY_START
        );
        return inventory;
    } catch (error) {
        console.error("Failed to upload to Odoo:", error);
        throw error;
    }
};
