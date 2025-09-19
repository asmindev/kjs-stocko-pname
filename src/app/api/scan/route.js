import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
    try {
        // Get user session
        const session = await getServerSession(authOptions);

        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized. Please login first." },
                { status: 401 }
            );
        }

        const data = await request.json();
        console.log("Received scan data:", data);

        const userId = parseInt(session.user.id);

        // Check if data contains products array (batch submission)
        if (data.products && Array.isArray(data.products)) {
            // Batch submission - create session and multiple products
            const { products } = data;

            // Create session with authenticated user ID
            const scanSession = await prisma.session.create({
                data: {
                    name: `Session ${new Date().toISOString()}`,
                    user_id: userId,
                },
            });

            const results = [];
            let successCount = 0;
            let failedCount = 0;

            // Process each product
            for (const product of products) {
                try {
                    const createdProduct = await prisma.product.create({
                        data: {
                            barcode: product.barcode,
                            name: product.name || "",
                            uom_id: product.uom_id
                                ? parseInt(product.uom_id)
                                : null,
                            quantity: product.quantity || 1,
                            session_id: scanSession.id,
                            userId: userId,
                        },
                    });

                    results.push({
                        success: true,
                        product: createdProduct,
                        originalData: product,
                    });
                    successCount++;
                } catch (error) {
                    console.error(
                        `Error creating product for barcode ${product.barcode}:`,
                        error
                    );
                    results.push({
                        success: false,
                        error: error.message,
                        originalData: product,
                    });
                    failedCount++;
                }
            }

            return Response.json({
                success: successCount > 0,
                successCount,
                failedCount,
                sessionId: scanSession.id,
                results,
                message: `${successCount} produk berhasil disimpan, ${failedCount} gagal`,
            });
        } else {
            // Single product submission (legacy support)
            const { barcode, name, uomId, quantity } = data;

            // Create session first
            const scanSession = await prisma.session.create({
                data: {
                    name: `Session ${new Date().toISOString()}`,
                    user_id: userId,
                },
            });

            // Create product
            const product = await prisma.product.create({
                data: {
                    barcode,
                    name: name || "",
                    uom_id: uomId ? parseInt(uomId) : null,
                    quantity: quantity || 1,
                    session_id: scanSession.id,
                    userId: userId,
                },
            });

            return Response.json({
                success: true,
                product,
                sessionId: scanSession.id,
                message: "Produk berhasil disimpan",
            });
        }
    } catch (error) {
        console.error("Error in scan API:", error);
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
