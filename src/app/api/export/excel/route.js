import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const XLSX = await import("xlsx");
    try {
        const products = await prisma.product.findMany({
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
            orderBy: {
                created_at: "desc",
            },
        });

        const worksheetData = products.map((product) => ({
            Barcode: product.barcode,
            PIC: product.session.user.name,
            "Nama Produk": product.name,
            Lokasi: product.location_name,
            UoM: product.uom_name,
            Jumlah: product.quantity,
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

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
        console.error("Error exporting to Excel:", error);
        return NextResponse.json(
            { error: "Failed to export" },
            { status: 500 }
        );
    }
}
