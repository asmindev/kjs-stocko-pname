"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { OdooSessionManager } from "@/lib/sessionManager";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";

// Fetch Single Line Detail (Merged with Prisma)
// Fetch Single Line Detail (Merged with Prisma)
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

        if (!odooResult) return { success: false, error: "Line not found" };

        // 2. Fetch Prisma Entries (All added entries)
        const localEntries = await prisma.verificationResult.findMany({
            where: { odoo_line_id: parseInt(lineId) },
        });

        // 3. Return Combined Data
        // Note: Session.inventory_id is often null, so we show all scans for this product
        return {
            success: true,
            data: {
                ...odooResult,
                entries: localEntries, // Pass list of entries to frontend

                // Fetch Previous Scans (all scans for this product_id)
                previousScans: await prisma.product.findMany({
                    where: {
                        barcode: odooResult.barcode,
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

// Fetch Locations (from inventory.product.locations)
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

// Fetch Users (Verifier Candidates)
export async function getOpnameUsers() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const users = await odoo.client.execute(
            "res.users",
            "search_read",
            [[["can_access_opname_react", "=", true]]],
            {
                fields: ["id", "name", "login"],
                limit: 100,
            }
        );

        return { success: true, data: users };
    } catch (e) {
        console.error("Error fetching users:", e);
        return { success: false, error: e.message };
    }
}

// Add New Verification Entry
export async function addVerificationEntry(
    lineId,
    qty,
    locationId,
    verifierId,
    note = ""
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        // 1. Sync to Odoo FIRST (to get verification_id)
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const odooResult = await odoo.client.execute(
            "custom.stock.inventory",
            "add_verification_qty",
            [],
            {
                line_id: parseInt(lineId),
                verification_qty: parseFloat(qty),
                inventory_product_location_id: parseInt(locationId),
                verifier_id: parseInt(verifierId),
                note: note || null,
            }
        );

        if (!odooResult.success) {
            console.error("Odoo sync failed:", odooResult.message);
            return {
                success: false,
                message: "Gagal menyimpan ke Odoo: " + odooResult.message,
            };
        }
        console.log("Odoo sync result:", odooResult);

        // 2. Save to Prisma (with Odoo verification_id)
        await prisma.verificationResult.create({
            data: {
                odoo_line_id: parseInt(lineId),
                odoo_verification_id: odooResult.data?.verification_id || null,
                product_qty: parseFloat(qty),
                location_id: parseInt(locationId),
                verifier_id: parseInt(verifierId),
                note: note || null,
            },
        });

        revalidatePath("/admin/verification");
        revalidatePath(`/admin/verification/${lineId}/edit`);

        return {
            success: true,
            message: "Entry added",
            odoo_sync: true,
        };
    } catch (e) {
        console.error("Error adding entry:", e);
        return { success: false, message: e.message };
    }
}

// Delete Entry
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

// Update Verification Total (Auto Calc)
export async function updateVerificationTotal(
    lineId,
    totalQty,
    locationId,
    verifierId,
    note = ""
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // 1. Call Odoo to Calculate and Set Total
        const odooResult = await odoo.client.execute(
            "custom.stock.inventory",
            "set_verification_total_qty",
            [],
            {
                line_id: parseInt(lineId),
                total_qty: parseFloat(totalQty),
                location_id: parseInt(locationId),
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

        // 2. If Diff is 0, nothing to save locally
        if (odooResult.diff === 0) {
            return {
                success: true,
                message: "Tidak ada perubahan stok (selisih 0)",
                no_change: true,
            };
        }

        // 3. Save Adjustment to Prisma
        // We save the DIFFERENCE returned by Odoo
        await prisma.verificationResult.create({
            data: {
                odoo_line_id: parseInt(lineId),
                odoo_verification_id: odooResult.verification_id,
                product_qty: parseFloat(odooResult.diff), // Save the Difference
                location_id: parseInt(locationId),
                verifier_id: parseInt(verifierId),
                note: note || `Update Total: ${totalQty}`,
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

export async function getVerificationData(
    inventoryId = null,
    page = 1,
    limit = 20,
    search = "",
    status = null,
    brand = null
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const documents = await prisma.document.findMany({
            where: {
                inventory_id: { not: null },
            },
            orderBy: {
                created_at: "desc",
            },
            select: {
                inventory_id: true,
                name: true,
            },
        });

        const allInventoryIds = documents
            .map((d) => d.inventory_id)
            .filter((id) => id !== null);

        if (allInventoryIds.length === 0) {
            return {
                success: true,
                meta: { total_items: 0 },
                data: [],
                inventories: [],
            };
        }

        let targetIds = [];
        if (inventoryId) {
            targetIds = [parseInt(inventoryId)];
        } else {
            targetIds = allInventoryIds;
        }

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const result = await odoo.client.execute(
            "custom.stock.inventory",
            "get_data_for_verification",
            [],
            {
                inventory_ids: targetIds,
                page: parseInt(page),
                limit: parseInt(limit),
                search_query: search || null,
                status_filter: status || null,
                brand_filter: brand || null,
            }
        );

        if (!result) {
            return { success: false, error: "Failed to fetch data from Odoo" };
        }

        const { data, meta } = result;

        // 4. Fetch ALL Entries for these lines from Prisma
        const lineIds = data.map((d) => d.id);

        if (lineIds.length > 0) {
            const entries = await prisma.verificationResult.findMany({
                where: {
                    odoo_line_id: { in: lineIds },
                },
            });

            // 5. Aggregate Entries
            const entriesMap = new Map();
            entries.forEach((e) => {
                const current = entriesMap.get(e.odoo_line_id) || 0;
                entriesMap.set(e.odoo_line_id, current + e.product_qty);
            });

            console.log("DEBUG: lineIds:", lineIds.slice(0, 5));
            console.log("DEBUG: entries count:", entries.length);
            console.log("DEBUG: entriesMap size:", entriesMap.size);

            for (let item of data) {
                const additionalQty = entriesMap.get(item.id) || 0;

                // Expose verification qty separately
                item.verification_qty = additionalQty;
                item.verification_hpp = additionalQty * (item.hpp || 0);

                // Total Aktual = Scan (dari Odoo) + Verifikasi (dari Prisma)
                // scanned_qty tetap original dari Odoo
                const originalScannedQty = item.scanned_qty || 0;
                item.total_qty = originalScannedQty + additionalQty;
                item.total_hpp = item.total_qty * (item.hpp || 0);

                // Recalc Stats - use total_qty for diff (Scan + Verifikasi - System)
                item.diff_qty = item.total_qty - item.system_qty;

                if (additionalQty > 0) {
                    item.is_verified = true;
                }

                if (item.diff_qty > 0) item.status = "Positif";
                else if (item.diff_qty < 0) item.status = "Negatif";
                else item.status = "Balance";

                item.hpp_diff = item.diff_qty * item.hpp;
            }
        }

        const inventories = documents
            .filter((d) => d.inventory_id && d.name)
            .map((d) => ({
                id: d.inventory_id,
                name: d.name,
            }));
        const uniqueInventories = Array.from(
            new Map(inventories.map((item) => [item.id, item])).values()
        );

        return {
            success: true,
            meta: meta,
            data: data,
            inventories: uniqueInventories,
        };
    } catch (error) {
        console.error("Error fetching verification data:", error);
        return { success: false, error: error.message };
    }
}

export async function getBrands() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        const brands = await odoo.client.execute(
            "custom.stock.inventory",
            "get_all_brands",
            [],
            {}
        );

        return { success: true, data: brands || [] };
    } catch (e) {
        console.error("Error fetching brands:", e);
        return { success: false, error: e.message };
    }
}
