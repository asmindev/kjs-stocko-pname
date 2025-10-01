"use server";

import { prisma } from "@/lib/prisma";
import path from "path";

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

export const getLeaders = async () => {
    const MODELS = "res.users";
    const DOMAIN = [
        ["can_access_opname_react", "=", true],
        ["role_opname_react", "=", "leader"],
    ];
    const FIELDS = ["id", "name", "email", "inventory_product_location_ids"];
    try {
        const leaders = await odoo.client.searchRead(MODELS, DOMAIN, FIELDS);
        return leaders;
    } catch (error) {
        console.error("Error fetching leaders from Odoo:", error);
        return [];
    }
};
