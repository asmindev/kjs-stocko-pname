import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";

/**
 * GET /api/product/search?barcode={barcode}
 * @description Search for a product in Odoo by barcode
 * @returns {Promise<Response>} A JSON response containing the product data
 */
export const GET = async (request) => {
    const session = await getServerSession(authOptions);
    const odoo = await OdooSessionManager.getClient(
        session.user.id,
        session.user.email
    );

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
        return NextResponse.json(
            { message: "Barcode parameter is required" },
            { status: 400 }
        );
    }
    const client = odoo.client;

    try {
        const auth = await client.authenticate();
        const DOMAIN = [["barcode", "ilike", barcode]];
        const MODEL = "product.template";
        const OPTIONS = {
            fields: [
                "name",
                "default_code",
                "list_price",
                "qty_available",
                "barcode",
                "uom_id",
                "uom_po_id",
            ],
            limit: 1,
        };

        // Search for product by barcode
        const product = await client.searchRead(MODEL, DOMAIN, OPTIONS);

        if (!product || product.length === 0) {
            return NextResponse.json(
                { message: "Product not found", product: null },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Product found",
            product: product[0],
        });
    } catch (error) {
        if (error) {
            return NextResponse.json(
                { message: "Odoo Authentication Failed", error: error.message },
                { status: 401 }
            );
        }
        console.error("Error searching product:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
};
