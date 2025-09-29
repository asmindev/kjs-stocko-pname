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
