import { OdooAuthenticationError, OdooClient } from "@tapni/odoo-xmlrpc";
import { NextResponse } from "next/server";

/**
 * GET /api/odoo
 * request - The incoming request object
 * @description Authenticate to Odoo instance and retrieve the current user data
 * @returns {Promise<Response>} A JSON response containing the authentication result and the current user data
 */
export const GET = async (request) => {
    const ODOO = {
        url: "http://localhost:8001",
        db: "kjsdev",
        username: "fachmi.maasy@technoindo.com",
        password: "Aldev@r08919",
    };
    const client = new OdooClient(ODOO);

    try {
        const auth = await client.authenticate();
        //   const [partner] = await client.read<CustomPartner>('res.partner', [partnerId]);
        const [partner] = await client.read(
            "res.users",
            [auth],
            ["name", "login"]
        );

        return NextResponse.json({ auth, partner });
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
