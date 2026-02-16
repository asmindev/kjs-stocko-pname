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

/**
 * Filter a list of inventory IDs based on whether they are daily opname or not.
 *
 * @param {import("@/app/odoo/index").default} odoo - Odoo client instance
 * @param {Array<number>} inventoryIds - List of inventory IDs to filter
 * @param {string} type - 'cycle' or 'annual'
 * @returns {Promise<Array<number>>} - Filtered list of inventory IDs
 */
export const getFilteredInventoryIds = async (
    odoo,
    inventoryIds,
    type = "cycle",
) => {
    if (!inventoryIds || inventoryIds.length === 0) return [];

    try {
        const domain = [
            ["id", "in", inventoryIds],
            ["is_daily_opname", "=", type === "cycle"],
        ];
        const filteredIds = await odoo.client.search(
            "custom.stock.inventory",
            domain,
        );
        return filteredIds;
    } catch (error) {
        console.error("Error filtering inventory IDs from Odoo:", error);
        return [];
    }
};

/**
 * Get ALL inventory IDs from Odoo that match a given type (cycle or annual).
 * This queries Odoo directly without needing local inventory IDs first.
 *
 * @param {import("@/app/odoo/index").default} odoo - Odoo client instance
 * @param {string} type - 'cycle' or 'annual'
 * @returns {Promise<Array<number>>} - All inventory IDs of the given type
 */
export const getAllInventoryIdsByType = async (odoo, type = "cycle") => {
    try {
        const isDailyValue = type === "cycle";
        const domain = [["is_daily_opname", "=", isDailyValue]];
        console.log(
            `[getAllInventoryIdsByType] Querying Odoo: type=${type}, is_daily_opname=${isDailyValue}`,
        );

        const results = await odoo.client.searchRead(
            "custom.stock.inventory",
            domain,
            { fields: ["id"] },
        );

        const inventoryIds = results.map((r) => r.id);
        console.log(
            `[getAllInventoryIdsByType] type=${type}, found ${inventoryIds.length} inventories, sample: ${inventoryIds.slice(0, 5)}`,
        );
        return inventoryIds;
    } catch (error) {
        console.error(
            `[getAllInventoryIdsByType] ERROR for type=${type}:`,
            error.message || error,
        );
        return [];
    }
};

export const getTotalProductsCount = async (
    warehouseId = null,
    type = "cycle",
) => {
    // get total products count from odoo, count with odoosession
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            throw new Error("Unauthorized. Please login first.");
        }

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email,
        );

        if (warehouseId) {
            const count = await odoo.client.execute(
                "custom.stock.inventory",
                "get_warehouse_product_count",
                [[parseInt(warehouseId)], type === "cycle"],
            );
            console.log(
                `Total products count from Odoo (Warehouse ${warehouseId}, Type: ${type}):`,
                count,
            );
            return count;
        }

        const count = await odoo.client.execute(
            "custom.stock.inventory",
            "get_warehouse_product_count",
            [[], type === "cycle"],
        );
        console.log(
            `Total products count from Odoo (All, Type: ${type}):`,
            count,
        );
        return count;
    } catch (error) {
        console.error("Error fetching total products count:", error);
        return 0;
    }
};
