import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function POST(request, { params }) {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized. Please login first." },
                { status: 401 }
            );
        }

        const { id } = await params;
        const data = await request.json();

        const is_allowed_role = ["leader", "admin"];
        const userRole = session?.user?.role;

        const isAllowed = is_allowed_role.includes(userRole);

        const userId = isAllowed ? null : parseInt(session.user.id);
        const whereClause = userId
            ? {
                  id: parseInt(id),
                  user_id: userId, // Only get session for logged-in user unless leader
              }
            : {
                  id: parseInt(id),
              };

        // Verify that the session exists and belongs to the user
        const existingSession = await prisma.session.findFirst({
            where: whereClause,
        });

        if (!existingSession) {
            return Response.json(
                {
                    success: false,
                    error: "Session not found or access denied.",
                },
                { status: 404 }
            );
        }

        // Check if session is already posted (cannot edit posted sessions)
        if (existingSession.state === "POST") {
            return Response.json(
                {
                    success: false,
                    error: "Cannot add products to posted session.",
                },
                { status: 400 }
            );
        }

        const { products, warehouse_id, warehouse_name } = data;

        // Update warehouse_id if provided (admin functionality)
        if (warehouse_id !== undefined && session?.user?.role === "admin") {
            await prisma.session.update({
                where: { id: parseInt(id) },
                data: {
                    warehouse_id: parseInt(warehouse_id),
                    warehouse_name: warehouse_name || null,
                },
            });
        }

        if (!products || !Array.isArray(products)) {
            return Response.json(
                { success: false, error: "Products array is required." },
                { status: 400 }
            );
        }

        let successCount = 0;
        let failedCount = 0;

        // Process each product using safer approach: check existence first
        for (const product of products) {
            try {
                const productData = {
                    barcode: product.barcode,
                    name: product.name || "",
                    product_id: product.product_id || null, // ID dari Odoo
                    uom_id: product.uom_id ? parseInt(product.uom_id) : null,
                    uom_name: product.uom_name || null,
                    quantity: product.quantity || 1,
                    session_id: parseInt(id),
                    userId: userId,
                    location_id: product.location_id
                        ? parseInt(product.location_id)
                        : null,
                    location_name: product.location_name || null,
                };

                console.log(
                    "Processing product:",
                    JSON.stringify(productData, null, 2)
                );

                // Check if product already exists for this session and barcode
                const existingProduct = await prisma.product.findFirst({
                    where: {
                        session_id: parseInt(id),
                        barcode: product.barcode,
                    },
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
                    },
                });

                if (existingProduct) {
                    // update userId too
                    productData.userId = existingProduct.userId;
                    // Update existing product
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: productData,
                    });
                } else {
                    // Create new product
                    await prisma.product.create({
                        data: productData,
                    });
                }
                successCount++;
            } catch (error) {
                console.error(
                    `Error processing product for barcode ${product.barcode}:`,
                    error
                );
                failedCount++;
            }
        }

        // Remove products that are no longer in the updated list
        // Get all barcodes from the current update
        const currentBarcodes = products.map((p) => p.barcode);

        // Delete products that exist in DB but not in current update
        const deletedCount = await prisma.product.deleteMany({
            where: {
                session_id: parseInt(id),
                barcode: {
                    notIn: currentBarcodes,
                },
            },
        });

        console.log(`Removed ${deletedCount.count} outdated products`);

        return Response.json({
            success: successCount > 0,
            successCount,
            failedCount,
            sessionId: parseInt(id),
            message: `${successCount} produk berhasil disimpan, ${failedCount} gagal`,
        });
    } catch (error) {
        console.error("Error in add products to session API:", error);
        return Response.json(
            {
                success: false,
                error: "Failed to process request",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
