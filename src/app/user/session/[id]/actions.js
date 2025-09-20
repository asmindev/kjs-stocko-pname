"use server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const uploadToOdoo = async (sessionId) => {
    try {
        const MODELS = "custom.stock.inventory";
        const METHOD = "prepare_inventory";

        const session = await getServerSession(authOptions);
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const result = await prisma.session.findUnique({
            where: { id: parseInt(sessionId) },
        });

        // POST Inventory to Odoo state `in progress`
        await odoo.client.execute(MODELS, METHOD, [result.inventory_id]);

        // update session state to POST
        await prisma.session.update({
            where: { id: parseInt(sessionId) },
            data: { state: "POST" },
        });
        revalidatePath(`/user/session/${sessionId}`);
        revalidatePath("/user/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to upload to Odoo:", error);
        throw error;
    }
};
