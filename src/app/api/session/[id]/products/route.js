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

        // IMPORTANT: Always use the original session creator's userId
        // This ensures that when leader/admin edits, the products still belong to the original checker
        const originalUserId = existingSession.user_id;

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

        // First, consolidate products with same barcode and location
        // Group by barcode + location_id and sum quantities
        const consolidatedProducts = products.reduce((acc, product) => {
            // Create unique key from barcode and location_id
            const key = `${product.barcode}_${product.location_id || "null"}`;

            if (acc[key]) {
                // If exists, add quantity
                acc[key].quantity =
                    (parseFloat(acc[key].quantity) || 0) +
                    (parseFloat(product.quantity) || 0);
            } else {
                // First occurrence, store it
                acc[key] = { ...product };
            }

            return acc;
        }, {});

        // Convert back to array
        const productsToSave = Object.values(consolidatedProducts);

        console.log(
            `Consolidated ${products.length} products into ${productsToSave.length} unique entries`
        );

        // Delete all existing products for this session
        await prisma.product.deleteMany({
            where: {
                session_id: parseInt(id),
            },
        });

        console.log(`Cleared all existing products for session ${id}`);

        // Process each consolidated product - create all as new
        for (const product of productsToSave) {
            try {
                const productData = {
                    barcode: product.barcode,
                    name: product.name || "",
                    product_id: product.product_id || null, // ID dari Odoo
                    uom_id: product.uom_id ? parseInt(product.uom_id) : null,
                    uom_name: product.uom_name || null,
                    quantity: parseFloat(product.quantity) || 1,
                    session_id: parseInt(id),
                    userId: originalUserId, // Use original session creator's userId
                    location_id: product.location_id
                        ? parseInt(product.location_id)
                        : null,
                    location_name: product.location_name || null,
                };

                console.log(
                    "Processing product:",
                    JSON.stringify(productData, null, 2)
                );

                // Create new product entry
                await prisma.product.create({
                    data: productData,
                });

                successCount++;
            } catch (error) {
                console.error(
                    `Error processing product for barcode ${product.barcode}:`,
                    error
                );
                failedCount++;
            }
        }

        console.log(`Created ${successCount} products for session ${id}`);

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
