"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { OdooSessionManager } from "@/lib/sessionManager";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Fetch single verification line detail with entries and scan history
 */
export async function getVerificationLine(lineId) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // 1. Fetch Odoo Data (Base)
        const odooResult = await odoo.client.execute(
            "custom.stock.inventory",
            "get_verification_line_detail",
            [],
            { line_id: parseInt(lineId) }
        );
        console.log("Odoo result:", odooResult);

        if (!odooResult.success)
            return { success: false, error: "Line not found" };

        // 2. Fetch Prisma Entries (All added entries)
        const localEntries = await prisma.verificationResult.findMany({
            where: { odoo_line_id: parseInt(lineId) },
        });

        // 3. Extract Odoo data (exclude 'success' field)
        const { success: _, ...odooData } = odooResult;

        // 4. Return Combined Data
        return {
            success: true,
            data: {
                ...odooData,
                entries: localEntries,

                // Fetch Previous Scans (all scans for this product_id)
                previousScans: await prisma.product.findMany({
                    where: {
                        barcode: odooData.barcode,
                        Document: {
                            inventory_id: odooData.custom_inventory_id,
                        },
                    },
                    include: {
                        User: {
                            select: { name: true },
                        },
                        session: {
                            select: { name: true },
                        },
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                    take: 20, // Limit to last 20 scans
                }),
            },
        };
    } catch (e) {
        console.error("Error fetching line:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Fetch available inventory locations
 */
export async function getInventoryLocationsForEdit() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const locations = await odoo.getInventoryLocations();

        return { success: true, data: locations };
    } catch (e) {
        console.error("Error fetching locations:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Fetch users who can verify (verifier candidates)
 */
export async function getOpnameUsers() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );
        const LIMIT = 100;
        const DOMAIN = [[["can_access_opname_react", "=", true]]];
        const FIELDS = ["id", "name", "login"];
        const PARAMS = { limit: LIMIT, fields: FIELDS };

        const users = await odoo.client.execute(
            "res.users",
            "search_read",
            DOMAIN,
            PARAMS
        );

        return { success: true, data: users };
    } catch (e) {
        console.error("Error fetching users:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Update verification total quantity
 */
export async function updateVerificationTotal(
    lineId,
    totalQty,
    locationIds,
    verifierId,
    note = "",
    verificationDateTime = ""
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // Call Odoo to calculate and set total
        const odooResult = await odoo.client.execute(
            "custom.stock.inventory",
            "set_verification_total_qty",
            [],
            {
                line_id: parseInt(lineId),
                total_qty: parseFloat(totalQty),
                location_ids: locationIds,
                verifier_id: parseInt(verifierId),
                note: note || null,
            }
        );

        console.log("Odoo calc result:", odooResult);

        if (!odooResult.success) {
            console.error("Odoo calc failed:", odooResult.message);
            return {
                success: false,
                message: "Gagal update stok di Odoo: " + odooResult.message,
            };
        }

        // If diff is 0, nothing to save locally
        if (odooResult.diff === 0) {
            return {
                success: true,
                message: "Tidak ada perubahan stok (selisih 0)",
                no_change: true,
            };
        }

        // Build note with optional datetime
        let finalNote = note || `Update Total: ${totalQty}`;
        if (verificationDateTime) {
            finalNote += ` [Waktu: ${verificationDateTime.replace("T", " ")}]`;
        }

        // Save adjustment to Prisma
        await prisma.verificationResult.create({
            data: {
                odoo_line_id: parseInt(lineId),
                odoo_verification_id: odooResult.verification_id,
                product_qty: parseFloat(odooResult.diff),
                location_id:
                    locationIds.length > 0 ? parseInt(locationIds[0]) : null,
                verifier_id: parseInt(verifierId),
                note: finalNote,
            },
        });

        revalidatePath("/admin/verification");
        revalidatePath(`/admin/verification/${lineId}/edit`);

        return {
            success: true,
            message: `Stok diupdate (Selisih: ${
                odooResult.diff > 0 ? "+" : ""
            }${odooResult.diff})`,
            diff: odooResult.diff,
        };
    } catch (e) {
        console.error("Error updating total:", e);
        return { success: false, message: e.message };
    }
}

/**
 * Delete verification entry
 */
export async function deleteVerificationEntry(
    entryId,
    lineId,
    odooVerificationId = null
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        // 1. Delete from Prisma
        await prisma.verificationResult.delete({
            where: { id: parseInt(entryId) },
        });

        // 2. Sync to Odoo (if odooVerificationId provided)
        if (odooVerificationId) {
            const odoo = await OdooSessionManager.getClient(
                session.user.id,
                session.user.email
            );

            const odooResult = await odoo.client.execute(
                "custom.stock.inventory",
                "delete_verification_qty",
                [],
                {
                    verification_id: parseInt(odooVerificationId),
                    line_id: parseInt(lineId),
                }
            );

            if (!odooResult.success) {
                console.warn("Odoo delete sync warning:", odooResult.message);
            }
            console.log("Odoo delete result:", odooResult);
        }

        revalidatePath("/admin/verification");
        revalidatePath(`/admin/verification/${lineId}/edit`);

        return { success: true, message: "Entry deleted" };
    } catch (e) {
        console.error("Error deleting entry:", e);
        return { success: false, message: e.message };
    }
}
