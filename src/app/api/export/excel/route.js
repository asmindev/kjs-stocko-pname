import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";

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

        // ===== FETCH BRANDS FROM ODOO =====
        const session = await getServerSession(authOptions);
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        // Get unique barcodes
        const barcodes = [
            ...new Set(products.map((p) => p.barcode).filter(Boolean)),
        ];

        console.log(
            `Fetching brands for ${barcodes.length} unique barcodes...`
        );

        // Bulk fetch product templates from Odoo by barcode
        let brandMap = {};
        if (barcodes.length > 0) {
            const productTemplates = await odoo.client.searchRead(
                "product.template",
                [["barcode", "in", barcodes]],
                {
                    fields: ["barcode", "brand_id"],
                }
            );

            console.log(`Found ${productTemplates.length} products in Odoo`);

            // Create brand map: barcode -> brand_name
            brandMap = productTemplates.reduce((map, template) => {
                if (template.barcode && template.brand_id) {
                    // product_brand_id format: [id, "Brand Name"]
                    map[template.barcode] = template.brand_id[1];
                }
                return map;
            }, {});

            console.log(`Mapped ${Object.keys(brandMap).length} brands`);
        }

        // Worksheet 1: Details (semua informasi lengkap)
        const detailsData = products.map((product) => {
            try {
                const user = product.session?.user || product.User;
                return {
                    BARCODE: product.barcode,
                    NAMA_BARANG: product.name,
                    UOM: product.uom_name,
                    BRAND: brandMap[product.barcode] || "", // Get from Odoo
                    QTY: product.quantity,
                    LOKASI: product.location_name,
                    PIC: user?.name || "",
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
                    BRAND: brandMap[product.barcode] || "", // Get from Odoo
                    QTY: product.quantity,
                });
            }
        });

        const summaryData = Array.from(summaryMap.values());

        // Get warehouse name and date
        const warehouseName =
            products[0]?.session?.warehouse_name || "Unknown Warehouse";
        const currentDate = new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // ===== DETAILS WORKSHEET =====
        // Create header title for Details
        const detailsTitle = `${warehouseName} - Detail ${currentDate}`;
        const detailsWSData = [
            [detailsTitle], // Title row
            [], // Empty row
            // Header row
            ["BARCODE", "NAMA_BARANG", "UOM", "BRAND", "QTY", "LOKASI", "PIC"],
        ];

        // Add data rows
        detailsData.forEach((row) => {
            detailsWSData.push([
                row.BARCODE,
                row.NAMA_BARANG,
                row.UOM,
                row.BRAND,
                row.QTY,
                row.LOKASI,
                row.PIC,
            ]);
        });

        const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsWSData);

        // Merge cells for title (A1:G1)
        detailsWorksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        ];

        // Center align the title
        if (!detailsWorksheet["A1"].s) detailsWorksheet["A1"].s = {};
        detailsWorksheet["A1"].s.alignment = {
            horizontal: "center",
            vertical: "center",
        };

        XLSX.utils.book_append_sheet(workbook, detailsWorksheet, "Details");

        // ===== SUMMARY WORKSHEET =====
        // Create header title for Summary
        const summaryTitle = `${warehouseName} - Summary ${currentDate}`;
        const summaryWSData = [
            [summaryTitle], // Title row
            [], // Empty row
            // Header row
            ["BARCODE", "PRODUCT", "BRAND", "QTY"],
        ];

        // Add data rows
        summaryData.forEach((row) => {
            summaryWSData.push([row.BARCODE, row.PRODUCT, row.BRAND, row.QTY]);
        });

        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryWSData);

        // Merge cells for title (A1:D1)
        summaryWorksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        ];

        // Center align the title
        if (!summaryWorksheet["A1"].s) summaryWorksheet["A1"].s = {};
        summaryWorksheet["A1"].s.alignment = {
            horizontal: "center",
            vertical: "center",
        };

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
