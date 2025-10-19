"use server";

import { prisma } from "@/lib/prisma";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";

export const getWarehouseList = async (odooSession) => {
    try {
        const warehouses = await odooSession.getWarehouses();
        return warehouses.warehouses;
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        return [];
    }
};

export const getInventoryLocations = async (odooSession) => {
    try {
        const locations = await odooSession.getInventoryLocations();
        return locations.locations;
    } catch (error) {
        console.error("Error fetching inventory locations:", error);
        return [];
    }
};

/**
 * Fetch the list of leaders from Odoo
 *
 * @param {import("@/app/odoo/index").default} odoo - Odoo client instance
 * @returns {Promise<Array<Object>>} - Promise that resolves to an array of leader objects
 */
export const getLeaders = async (odoo) => {
    const MODELS = "res.users";
    const DOMAIN = [
        ["can_access_opname_react", "=", true],
        ["role_opname_react", "=", "leader"],
    ];
    const OPTIONS = {
        fields: {
            id: {},
            name: {},
            email: {},
            inventory_product_location_ids: {
                fields: ["id", "name"], // field yang mau diambil dari relasi
            },
        },
    };
    try {
        const leaders = await odoo.client.searchRead(MODELS, DOMAIN, OPTIONS);
        return leaders;
    } catch (error) {
        console.error("Error fetching leaders from Odoo:", error);
        return [];
    }
};

export const getTotalProductsCount = async () => {
    // get total products count from odoo, count with odoosession
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            throw new Error("Unauthorized. Please login first.");
        }

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const count = await odoo.client.searchCount("product.product", []);
        console.log("Total products count from Odoo:", count);
        return count;
    } catch (error) {
        console.error("Error fetching total products count:", error);
        return 0;
    }
};
