import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { uploadToOdoo } from "./actions";

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

        const userId = parseInt(session.user.id);

        // Check if data contains the new format with warehouse and products
        if (data.warehouse && data.products && Array.isArray(data.products)) {
            // New format with warehouse - create session and multiple products
            const { warehouse, warehouse_name, products } = data;

            // Create session with authenticated user ID and warehouse
            const scanSession = await prisma.session.create({
                data: {
                    name: `Session ${new Date().toISOString()}`,
                    user_id: userId,
                    warehouse_id: parseInt(warehouse),
                    warehouse_name: warehouse_name || null,
                },
            });

            const results = [];
            let successCount = 0;
            let failedCount = 0;

            // Process each product
            for (const product of products) {
                try {
                    const productData = {
                        barcode: product.barcode,
                        name: product.name || "",
                        product_id: product.product_id || null, // ID dari Odoo
                        uom_id: product.uom_id
                            ? parseInt(product.uom_id)
                            : null,
                        uom_name: product.uom_name || null,
                        quantity: product.quantity || 1,
                        session_id: scanSession.id,
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
            // const inventory = await uploadToOdoo(scanSession.id);
            // await prisma.session.update({
            //     where: { id: scanSession.id },
            //     data: { inventory_id: inventory },
            // });
            return Response.json({
                success: successCount > 0,
                successCount,
                failedCount,
                sessionId: scanSession.id,
                warehouseId: parseInt(warehouse),
                message: `${successCount} produk berhasil disimpan di gudang, ${failedCount} gagal`,
            });
        }
        // Check if data contains products array (legacy batch submission)
        else if (data.products && Array.isArray(data.products)) {
            // Legacy batch submission - create session and multiple products
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
