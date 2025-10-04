"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get all sessions that can be confirmed by a leader
 * Only sessions in DRAFT state from checker users
 */
export async function getConfirmableSessions() {
    try {
        const sessions = await prisma.session.findMany({
            where: {
                state: "DRAFT",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                products: {
                    select: {
                        id: true,
                        name: true,
                        barcode: true,
                        quantity: true,
                        state: true,
                        location_name: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        });

        // Calculate product counts and total quantities for each session
        const sessionsWithStats = sessions.map((session) => ({
            ...session,
            productCount: session.products.length,
            totalQuantity: session.products.reduce(
                (sum, product) => sum + product.quantity,
                0
            ),
            draftProductCount: session.products.filter(
                (p) => p.state === "DRAFT"
            ).length,
        }));

        return { success: true, data: sessionsWithStats };
    } catch (error) {
        console.error("Error fetching confirmable sessions:", error);
        return { success: false, error: "Failed to fetch sessions" };
    }
}

/**
 * Confirm selected sessions - change state from DRAFT to CONFIRMED
 */
export async function confirmSessions(sessionIds) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if user has leader or admin role
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true, id: true },
        });

        if (!user || !["leader", "admin"].includes(user.role)) {
            return {
                success: false,
                error: "Insufficient permissions. Only leaders and admins can confirm sessions.",
            };
        }

        // Validate that all sessions are in DRAFT state and belong to checker users
        const sessions = await prisma.session.findMany({
            where: {
                id: { in: sessionIds },
                state: "DRAFT",
            },
            include: {
                user: {
                    select: { role: true },
                },
            },
        });

        if (sessions.length !== sessionIds.length) {
            return {
                success: false,
                error: "Some sessions are not valid for confirmation",
            };
        }

        // Update sessions to CONFIRMED state
        const updateResult = await prisma.session.updateMany({
            where: {
                id: { in: sessionIds },
                state: "DRAFT",
            },
            data: {
                state: "CONFIRMED",
            },
        });

        // Also update all products in these sessions to CONFIRMED state
        await prisma.product.updateMany({
            where: {
                session_id: { in: sessionIds },
                state: "DRAFT",
            },
            data: {
                state: "CONFIRMED",
            },
        });

        revalidatePath("/user/confirm");

        return {
            success: true,
            message: `Successfully confirmed ${updateResult.count} sessions`,
            confirmedCount: updateResult.count,
        };
    } catch (error) {
        console.error("Error confirming sessions:", error);
        return { success: false, error: "Failed to confirm sessions" };
    }
}

/**
 * Get session details with products
 */
export async function getSessionDetails(sessionId) {
    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                products: {
                    include: {
                        uom: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                },
            },
        });

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        return { success: true, data: session };
    } catch (error) {
        console.error("Error fetching session details:", error);
        return { success: false, error: "Failed to fetch session details" };
    }
}
