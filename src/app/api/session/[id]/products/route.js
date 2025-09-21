import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

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
        const userId = parseInt(session.user.id);

        // Verify that the session exists and belongs to the user
        const existingSession = await prisma.session.findFirst({
            where: {
                id: parseInt(id),
                user_id: userId,
            },
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

        const { products } = data;

        if (!products || !Array.isArray(products)) {
            return Response.json(
                { success: false, error: "Products array is required." },
                { status: 400 }
            );
        }

        // First, delete all existing products for this session
        await prisma.product.deleteMany({
            where: {
                session_id: parseInt(id),
            },
        });

        const results = [];
        let successCount = 0;
        let failedCount = 0;

        // Process each product (create new ones)
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

                await prisma.product.create({
                    data: productData,
                });
                successCount++;
            } catch (error) {
                console.error(
                    `Error creating product for barcode ${product.barcode}:`,
                    error
                );
                failedCount++;
            }
        }

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
