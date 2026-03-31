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
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    products: {
                        some: {
                            barcode: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ];
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

export async function updateProduct(productId, data) {
    try {
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

        // Basic validation: ensure productId is provided
        if (!productId) {
            return { success: false, error: "Product ID is required" };
        }

        // For non-admins/leaders, ensure they own the session the product belongs to
        if (!isAllowed) {
            const product = await prisma.product.findUnique({
                where: { id: parseInt(productId) },
                include: { session: true },
            });

            if (!product || product.session?.user_id !== parseInt(session.user.id)) {
                return { success: false, error: "Unauthorized access to this product" };
            }
        }

        // Filter data to only allow updating specific fields
        const allowedFields = ["quantity", "barcode", "location_name", "state"];
        const updateData = {};
        Object.keys(data).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = data[key];
            }
        });

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(productId) },
            data: updateData,
            include: {
                session: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                ...updatedProduct,
                created_at: updatedProduct.created_at.toISOString(),
            },
        };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Failed to update product" };
    }
}
