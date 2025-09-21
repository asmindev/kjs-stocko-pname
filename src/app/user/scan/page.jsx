import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { OdooSessionManager } from "@/lib/sessionManager";
import React from "react";
import Scanner from "./Index";

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return <div>Not authenticated</div>;
    }

    try {
        // Ambil Odoo client dari session manager (akan load dari database)
        const client = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
            // Tidak perlu password karena sudah tersimpan di database
        );

        const warehouses = await client.getWarehouses();
        const inventoryLocations = await client.getInventoryLocations();

        return (
            <Scanner
                warehouses={warehouses.warehouses}
                inventoryLocations={inventoryLocations.locations}
            />
        );
    } catch (error) {
        console.error("Error loading Odoo client or warehouses:", error);
    }
}
