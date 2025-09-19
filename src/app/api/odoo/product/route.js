import Client from "@/app/odoo";
import { OdooAuthenticationError, OdooClient } from "@tapni/odoo-xmlrpc";
import { NextResponse } from "next/server";

/**
 * GET /api/odoo
 * request - The incoming request object
 * @description Authenticate to Odoo instance and retrieve the current user data
 * @returns {Promise<Response>} A JSON response containing the authentication result and the current user data
 */
export const GET = async (request) => {
    const params = request.nextUrl.searchParams;
    const barcode = params.get("barcode");
    console.log("Barcode from query params:", barcode);

    try {
        const client = new Client({
            email: "fachmi.maasy@technoindo.com",
            password: "Aldev@r08919",
        });
        const product = await client.product(barcode);
        if (product.error) {
            return NextResponse.json(
                { message: "Product not found", error: product.error },
                { status: 404 }
            );
        }
        console.log("Fetched product from Odoo:", product);
        return NextResponse.json(product);
    } catch (error) {
        if (error instanceof OdooAuthenticationError) {
            return NextResponse.json(
                { message: "Odoo Authentication Failed", error: error.message },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
};
