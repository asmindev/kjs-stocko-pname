"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

export async function getSessions() {
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

        const sessions = await prisma.session.findMany({
            where: {
                user_id: userId, // Only get sessions for logged-in user
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

        // Transform data untuk menambahkan informasi jumlah produk
        const sessionsWithProductCount = sessions.map((session) => ({
            ...session,
            productCount: session.products.length,
            created_at: session.created_at.toISOString(),
        }));

        return { success: true, data: sessionsWithProductCount };
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
