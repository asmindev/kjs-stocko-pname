"use server";
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
