import React from "react";
import EditSession from "./EditSession";
import { getSessionById } from "@/app/user/dashboard/services/actions";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { OdooSessionManager } from "@/lib/sessionManager";
import { redirect } from "next/navigation";

export default async function EditSessionPage({ params }) {
    const { id } = await params;
    const result = await getSessionById(id);

    // Redirect if session not found
    if (!result.success) {
        redirect(`/admin/session/${id}`);
    }

    // For admin, allow editing even if posted (admin can edit everything)
    // No redirect for posted sessions in admin mode

    // Get inventory locations and warehouses for the edit form
    let inventoryLocations = [];
    let warehouses = [];
    try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
            const client = await OdooSessionManager.getClient(
                session.user.id,
                session.user.email
            );
            const locations = await client.getInventoryLocations();
            const warehouseData = await client.getWarehouses();
            inventoryLocations = locations.locations || [];
            warehouses = warehouseData.warehouses || [];
        }
    } catch (error) {
        console.error("Error loading Odoo data:", error);
    }

    return (
        <EditSession
            sessionData={result.data}
            inventoryLocations={inventoryLocations}
            warehouses={warehouses}
        />
    );
}
