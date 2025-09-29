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

export const exportToExcel = async () => {
    const XLSX = await import("xlsx");

    // load `products` from prisma
    const products = await prisma.product.findMany({
        include: {
            session: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });

    const worksheetData = products.map((product) => ({
        barcode: product.barcode,
        name: product.name,
        quantity: product.quantity,
        uom_name: product.uom_name,
        location_name: product.location_name,
        session_id: product.session_id,
        userId: product.session.user.id,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // 3. Simpan file Excel di folder temporary (misal `/tmp`)
    const tempDir = path.join(process.cwd(), "public", "tmp");
    const filePath = path.join(tempDir, "products.xlsx");
    XLSX.writeFile(workbook, filePath);
    console.log("Excel file saved to:", filePath);

    return filePath;
};
