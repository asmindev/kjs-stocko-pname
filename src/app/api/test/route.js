import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";
import { NextResponse } from "next/server";

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
            `Bulk inventory created: ${result.name} with ${result.lines_count} lines`,
        );
        return result;
    } catch (error) {
        throw new Error(
            `Gagal membuat inventory adjustment di Odoo: ${error.message}`,
        );
    }
}

export const GET = async () => {
    const session = await getServerSession(authOptions);
    const odoo = await OdooSessionManager.getClient(
        session.user.id,
        session.user.email,
    );

    const vals = {
        name: "TKJS/TEST",
        location_id: 8,
        filter: "partial",
        date: "2025-10-19 14:30:00",
        accounting_date: "2025-10-19 14:30:00",
        line_ids: [
            {
                product_tmpl_id: 34187,
                product_uom_id: 8,
                product_qty: 20.0,
                location_id: 52,
            },
        ],
    };
    try {
        const result = await createInventoryAdjustment(odoo, vals);
        console.log("Inventory adjustment created successfully:", result);
    } catch (error) {
        console.error("Error creating inventory adjustment:", error);
    }
    return NextResponse.json({ message: "Hello World" });
};
