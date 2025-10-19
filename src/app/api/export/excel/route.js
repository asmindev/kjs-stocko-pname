import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
    const XLSX = await import("xlsx");
    try {
        // Get warehouseId from query params
        const { searchParams } = new URL(req.url);
        const warehouseId = searchParams.get("warehouseId");

        if (!warehouseId) {
            return NextResponse.json(
                { error: "warehouseId parameter is required" },
                { status: 400 }
            );
        }

        // Filter products by warehouseId through session relation
        // Include products that have session with matching warehouse_id
        // OR products without session but might belong to the warehouse
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    {
                        session: {
                            warehouse_id: parseInt(warehouseId),
                        },
                    },
                    {
                        // Include products without session (legacy data)
                        session_id: null,
                    },
                ],
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
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
            orderBy: {
                created_at: "desc",
            },
        });

        console.log(
            `Found ${products.length} products for warehouse ${warehouseId}`
        );

        // Worksheet 1: Details (semua informasi lengkap)
        const detailsData = products.map((product) => {
            try {
                const user = product.session?.user || product.User;
                return {
                    BARCODE: product.barcode,
                    NAMA_BARANG: product.name,
                    UOM: product.uom_name,
                    BRAND: product.brand || "",
                    QTY: product.quantity,
                    LOKASI: product.location_name,
                    PIC: user.name,
                };
            } catch (error) {
                console.log(
                    "Error mapping product to worksheet data:",
                    error,
                    product
                );
                throw error;
            }
        });

        // Worksheet 2: Summary (aggregate by barcode and warehouse)
        const summaryMap = new Map();

        products.forEach((product) => {
            const key = `${product.barcode}-${
                product.session?.warehouse_name || "Unknown"
            }`;

            if (summaryMap.has(key)) {
                // Jika sudah ada, tambahkan quantity
                const existing = summaryMap.get(key);
                existing.QTY += product.quantity;
            } else {
                // Jika belum ada, buat entry baru
                summaryMap.set(key, {
                    BARCODE: product.barcode,
                    PRODUCT: product.name,
                    QTY: product.quantity,
                    WAREHOUSE: product.session?.warehouse_name || "Unknown",
                });
            }
        });

        const summaryData = Array.from(summaryMap.values());

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add Details worksheet
        const detailsWorksheet = XLSX.utils.json_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(workbook, detailsWorksheet, "Details");

        // Add Summary worksheet
        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        return new NextResponse(buffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename=products_${
                    new Date().toISOString().split("T")[0]
                }.xlsx`,
            },
        });
    } catch (error) {
        console.log("Error exporting to Excel:", error);
        return NextResponse.json(
            { error: "Failed to export", details: error.message },
            { status: 500 }
        );
    }
}
