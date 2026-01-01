"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get all sessions that can be confirmed by a leader
 * Only sessions in DRAFT state from checker users
 */
export async function getConfirmableSessions({
    page = 1,
    limit = 10,
    search = "",
    user = "",
    warehouse = "",
    location = "",
} = {}) {
    try {
        const skip = (page - 1) * limit;
        const where = {
            state: "DRAFT",
        };

        // Filters
        if (user) {
            where.user = { name: user };
        }
        if (warehouse) {
            where.warehouse_name = warehouse;
        }
        if (location) {
            where.products = {
                some: { location_name: location },
            };
        }

        // Search
        if (search) {
            const searchLower = search.toLowerCase();
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                {
                    warehouse_name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    products: {
                        some: {
                            OR: [
                                {
                                    name: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    barcode: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    location_name: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                    },
                },
            ];
        }

        const [sessions, totalCount, productStats] = await Promise.all([
            prisma.session.findMany({
                where,
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
                skip,
                take: limit,
            }),
            prisma.session.count({ where }),
            prisma.product.aggregate({
                where: {
                    session: where, // Re-use the session filters
                },
                _count: {
                    _all: true,
                },
                _sum: {
                    quantity: true,
                },
            }),
        ]);

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

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: sessionsWithStats,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
            },
            stats: {
                totalSessions: totalCount,
                totalProducts: productStats._count._all,
                totalQuantity: productStats._sum.quantity || 0,
            },
        };
    } catch (error) {
        console.error("Error fetching confirmable sessions:", error);
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getConfirmPageFilters() {
    try {
        // Fetch unique users, warehouses, and locations from DRAFT sessions
        const where = { state: "DRAFT" };

        const [users, warehouses, locations] = await Promise.all([
            prisma.session.findMany({
                where,
                select: { user: { select: { name: true } } },
                distinct: ["user_id"], // assuming user_id relation
            }),
            prisma.session.findMany({
                where,
                select: { warehouse_name: true },
                distinct: ["warehouse_name"],
            }),
            // For locations, it's harder because it's in products.
            // We'll fetch all products in DRAFT sessions and distinct them.
            // CAUTION: This might be heavy if there are millions of products.
            // Optimization: Use clean SQL or aggregate if possible.
            // For now, let's fetch products with distinct location_name in DRAFT sessions
            prisma.product.findMany({
                where: {
                    session: { state: "DRAFT" },
                    location_name: { not: null },
                },
                select: { location_name: true },
                distinct: ["location_name"],
            }),
        ]);

        return {
            success: true,
            filters: {
                users: users
                    .map((u) => u.user?.name)
                    .filter(Boolean)
                    .sort(),
                warehouses: warehouses
                    .map((w) => w.warehouse_name)
                    .filter(Boolean)
                    .sort(),
                locations: locations
                    .map((l) => l.location_name)
                    .filter(Boolean)
                    .sort(),
            },
        };
    } catch (error) {
        console.error("Error fetching filters:", error);
        return {
            success: false,
            filters: { users: [], warehouses: [], locations: [] },
        };
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
