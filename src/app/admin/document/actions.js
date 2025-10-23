"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";
export async function getDocuments() {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return {
                success: false,
                error: "Unauthorized. Please login first.",
            };
        }

        const userId = parseInt(session.user.id);

        const documents = await prisma.document.findMany({
            where: {
                inventory_id: { not: null },
                // state: { notIn: ["DRAFT"] },
            },
            include: {
                products: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        });

        // console.log({ documents });

        // Transform data untuk menambahkan informasi jumlah produk
        // const sessionsWithProductCount = documents.map((session) => ({
        //     ...session,
        //     productCount: session.products.length,
        //     created_at: session.created_at.toISOString(),
        // }));

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // get documents from odoo
        const MODEL = "custom.stock.inventory";
        const domain = [["id", "in", documents.map((s) => s.inventory_id)]];
        const fields = [
            "location_id",
            "state",
            "name",
            "date",
            "name",
            "approval_desc",
            "line_ids",
            "create_uid",
        ];
        const inventory = await odoo.client.searchRead(MODEL, domain, {});

        return { success: true, documents: inventory };
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getWarehouseLocations() {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return {
                success: false,
                error: "Unauthorized. Please login first.",
            };
        }

        if (!session.user.is_admin) {
            return {
                success: false,
                error: "Forbidden - Admin access required",
            };
        }

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // Get stock locations from Odoo
        const MODEL = "stock.location";
        const domain = [
            ["usage", "=", "internal"], // Only internal/warehouse locations
            // ["company_id", "=", session.user.company_id] // Optional: filter by company
        ];
        const fields = ["id", "name", "complete_name", "location_id"];

        const locations = await odoo.client.searchRead(MODEL, domain, fields);

        return { success: true, locations };
    } catch (error) {
        console.error("Error fetching warehouse locations:", error);
        return { success: false, error: "Failed to fetch warehouse locations" };
    }
}

export async function generateZeroQuantity(inventoryIds, locationId) {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return {
                success: false,
                error: "Unauthorized. Please login first.",
            };
        }

        if (!session.user.is_admin) {
            return {
                success: false,
                error: "Forbidden - Admin access required",
            };
        }

        // Validate input
        if (
            !inventoryIds ||
            !Array.isArray(inventoryIds) ||
            inventoryIds.length === 0
        ) {
            return {
                success: false,
                error: "inventory_ids is required and must be a non-empty array",
            };
        }

        if (!locationId || typeof locationId !== "number") {
            return {
                success: false,
                error: "location_id is required and must be a number",
            };
        }

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // Call custom method generate_zero_quantity
        const MODEL = "custom.stock.inventory";
        const METHOD = "generate_zero_quantity";
        const PARAMS = [inventoryIds, locationId];
        const result = await odoo.client.execute(MODEL, METHOD, PARAMS);

        const resp = {
            success: true,
            message: "Zero quantity inventory generated successfully",
            data: result,
            line_count: result?.line_ids?.length || 0,
        };
        console.log("generateZeroQuantity response:", resp);
        //      inventory_id   Int? // ID dari Odoo
        // name           String?
        // created_at     DateTime      @default(now())
        // warehouse_id   Int?
        // warehouse_name String?
        // state          DocumentState @default(POST)
        // // Foreign key to user
        // userId         Int?
        // created document
        const doc = await prisma.document.create({
            data: {
                inventory_id: result.inventory_id,
                name: result.name,
                warehouse_id: locationId,
                warehouse_name: result.location_id?.[1] || "Unknown Location",
                state: "POST",
                userId: parseInt(session.user.id),
            },
        });
        console.log("Created document record:", doc);
        return resp;
    } catch (error) {
        console.error("Error generating zero quantity:", error);
        return {
            success: false,
            error:
                error.message || "Failed to generate zero quantity inventory",
        };
    }
}
