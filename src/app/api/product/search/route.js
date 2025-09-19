import { OdooAuthenticationError, OdooClient } from "@tapni/odoo-xmlrpc";
import { NextResponse } from "next/server";

/**
 * GET /api/product/search?barcode={barcode}
 * @description Search for a product in Odoo by barcode
 * @returns {Promise<Response>} A JSON response containing the product data
 */
export const GET = async (request) => {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
        return NextResponse.json(
            { message: "Barcode parameter is required" },
            { status: 400 }
        );
    }

    const ODOO = {
        url: process.env.ODOO_URL,
        db: process.env.ODOO_DB,
        username: "fachmi.maasy@technoindo.com",
        password: "Aldev@r08919",
    };

    const client = new OdooClient(ODOO);

    try {
        const auth = await client.authenticate();
        console.log("Authenticated user ID:", auth);
        const DOMAIN = [["barcode", "=", barcode]];
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
        console.log("Product found:", product[0]);

        return NextResponse.json({
            message: "Product found",
            product: product[0],
        });
    } catch (error) {
        if (error instanceof OdooAuthenticationError) {
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
