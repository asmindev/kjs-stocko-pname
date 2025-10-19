import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    console.log("parameters received:", params);
    try {
        const { id } = await params; // inventory_id dari Odoo

        // Get user session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get Odoo client
        const odoo = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email
        );

        console.log(`Downloading Excel for inventory ID: ${id}`);

        // Ambil data dari Odoo, generate Excel di Next.js menggunakan xlsx
        try {
            // Panggil method get_report_data untuk ambil data JSON
            const reportData = await odoo.client.execute(
                "custom.stock.inventory",
                "get_report_data",
                [[parseInt(id)]]
            );

            console.log("Received report data:", reportData);

            if (!reportData) {
                throw new Error("Failed to get report data");
            }

            // Import xlsx library
            const XLSX = await import("xlsx");

            // Prepare data untuk worksheet - format simple
            const now = new Date();
            const printDate = now.toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            // Build worksheet data array
            const wsData = [];

            // Title (row 1-2, merged)
            wsData.push([reportData.document.name]);
            wsData.push([]);
            wsData.push([]);

            // Info section
            wsData.push([
                "Approve",
                ":",
                reportData.document.approval_desc,
                "",
                "Tanggal Cetak",
                ":",
                printDate,
            ]);
            wsData.push([
                "Lokasi",
                ":",
                reportData.document.location,
                "",
                "Tanggal",
                ":",
                reportData.document.date,
            ]);
            wsData.push([
                "Tipe",
                ":",
                reportData.document.filter,
                "",
                "Tanggal Akuntansi",
                ":",
                reportData.document.accounting_date,
            ]);
            wsData.push([
                "Terakhir Diperbarui",
                ":",
                reportData.document.write_uid,
                "",
                "Status",
                ":",
                reportData.document.state,
            ]);

            wsData.push([]);
            wsData.push([]);

            // Table header
            wsData.push([
                "Barcode",
                "Produk",
                "UoM",
                "Kuantitas Sistem",
                "Kuantitas Nyata",
                "Selisih",
                "HPP",
                "Total HPP",
            ]);

            // Table data
            reportData.lines.forEach((line) => {
                wsData.push([
                    line.barcode,
                    line.product_name,
                    line.uom,
                    line.theoretical_qty,
                    line.real_qty,
                    line.diff_qty,
                    line.standard_price,
                    line.total_hpp,
                ]);
            });

            // Empty rows before total
            wsData.push([]);
            wsData.push([]);

            // Total row
            wsData.push([
                "Total",
                "",
                "",
                "",
                "",
                "",
                "",
                reportData.total_hpp,
            ]);

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths
            worksheet["!cols"] = [
                { wch: 15 }, // Barcode
                { wch: 40 }, // Product
                { wch: 10 }, // UoM
                { wch: 18 }, // Theoretical
                { wch: 18 }, // Real
                { wch: 12 }, // Diff
                { wch: 15 }, // HPP
                { wch: 15 }, // Total HPP
            ];

            // Create workbook and add worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Inventory Adjustment"
            );

            // Generate buffer
            const buffer = XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });

            return new Response(buffer, {
                headers: {
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="inventory_${id}.xlsx"`,
                    "Content-Length": buffer.length.toString(),
                },
            });
        } catch (renderError) {
            console.error("Error rendering report:", renderError);
            throw renderError;
        }
    } catch (error) {
        console.error("Error downloading Excel:", error);
        return NextResponse.json(
            { error: error.message || "Failed to download Excel" },
            { status: 500 }
        );
    }
}
