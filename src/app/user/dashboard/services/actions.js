"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

export async function getSessions({ page = 1, limit = 10, search = "" } = {}) {
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
        const skip = (page - 1) * limit;

        const where = {
            user_id: userId,
        };

        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive",
            };
        }

        // Parallel fetch for data and count
        const [sessions, totalCount] = await Promise.all([
            prisma.session.findMany({
                where,
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
                skip,
                take: limit,
            }),
            prisma.session.count({ where }),
        ]);

        // Transform data untuk menambahkan informasi jumlah produk
        const sessionsWithProductCount = sessions.map((session) => ({
            ...session,
            productCount: session.products.length,
            created_at: session.created_at.toISOString(),
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: sessionsWithProductCount,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getSessionById(sessionId) {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return {
                success: false,
                error: "Unauthorized. Please login first.",
            };
        }

        const is_allowed_role = ["leader", "admin"];
        const userRole = session?.user?.role;

        const isAllowed = is_allowed_role.includes(userRole);

        const userId = isAllowed ? null : parseInt(session.user.id);

        const whereClause = userId
            ? {
                  id: parseInt(sessionId),
                  user_id: userId, // Only get session for logged-in user unless leader
              }
            : {
                  id: parseInt(sessionId),
              };

        const sessionData = await prisma.session.findUnique({
            where: whereClause,
            include: {
                products: {
                    orderBy: {
                        created_at: "asc",
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!sessionData) {
            return {
                success: false,
                error: "Session not found or access denied",
            };
        }

        return {
            success: true,
            data: {
                ...sessionData,
                created_at: sessionData.created_at.toISOString(),
                products: sessionData.products.map((product) => ({
                    ...product,
                    created_at: product.created_at.toISOString(),
                })),
            },
        };
    } catch (error) {
        console.error("Error fetching session:", error);
        return { success: false, error: "Failed to fetch session" };
    }
}
