import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
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

            if (!reportData) {
                throw new Error("Failed to get report data");
            }

            // Import xlsx library
            const XLSX = await import("xlsx");

            // Helper function untuk format rupiah
            const formatRupiah = (number) => {
                return new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(number);
            };

            // Calculate summary statistics
            const positifLines = reportData.lines.filter(
                (l) => l.keterangan === "Positif"
            );
            const negatifLines = reportData.lines.filter(
                (l) => l.keterangan === "Negatif"
            );
            const balanceLines = reportData.lines.filter(
                (l) => l.keterangan === "Sama"
            );

            const summary = {
                positif: {
                    count: positifLines.length,
                    totalValue: positifLines.reduce(
                        (sum, l) => sum + l.selisih_value,
                        0
                    ),
                },
                negatif: {
                    count: negatifLines.length,
                    totalValue: negatifLines.reduce(
                        (sum, l) => sum + l.selisih_value,
                        0
                    ),
                },
                balance: {
                    count: balanceLines.length,
                    totalValue: balanceLines.reduce(
                        (sum, l) => sum + l.selisih_value,
                        0
                    ),
                },
            };

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
                "Brand",
                "UoM",
                "Qty Sistem",
                "Qty Fisik",
                "Selisih",
                "HPP",
                "Selisih Value",
                "Keterangan",
            ]);

            // Table data
            reportData.lines.forEach((line) => {
                wsData.push([
                    String(line.barcode || ""), // Convert to string explicitly
                    line.product_name,
                    line.brand || "",
                    line.uom,
                    line.theoretical_qty,
                    line.real_qty,
                    line.diff_qty,
                    line.standard_price, // Keep as number, will format later
                    line.selisih_value, // Keep as number, will format later
                    line.keterangan,
                ]);
            });

            // Empty rows before total
            wsData.push([]);
            wsData.push([]);

            // Summary section
            wsData.push(["Summary:", "", "", "", "", "", "", "", "", ""]);
            wsData.push([
                "Positif",
                ":",
                `${summary.positif.count} Produk`,
                "",
                "",
                "",
                "",
                "",
                summary.positif.totalValue, // Keep as number
                "",
            ]);
            wsData.push([
                "Negatif",
                ":",
                `${summary.negatif.count} Produk`,
                "",
                "",
                "",
                "",
                "",
                summary.negatif.totalValue, // Keep as number
                "",
            ]);
            wsData.push([
                "Balance (Sama)",
                ":",
                `${summary.balance.count} Produk`,
                "",
                "",
                "",
                "",
                "",
                summary.balance.totalValue, // Keep as number
                "",
            ]);
            wsData.push([]);

            // Total row
            wsData.push([
                "Total Selisih Value",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                reportData.total_selisih_value, // Keep as number
                "",
            ]);

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths
            worksheet["!cols"] = [
                { wch: 15 }, // Barcode
                { wch: 40 }, // Product
                { wch: 15 }, // Brand
                { wch: 10 }, // UoM
                { wch: 12 }, // Qty Sistem
                { wch: 12 }, // Qty Fisik
                { wch: 12 }, // Selisih
                { wch: 15 }, // HPP
                { wch: 18 }, // Selisih Value
                { wch: 12 }, // Keterangan
            ];

            // Format barcode column as text to prevent scientific notation
            // Starting from row 10 (after headers) where data begins
            const dataStartRow = 10; // Row index where data starts (0-based)
            for (
                let i = dataStartRow;
                i < dataStartRow + reportData.lines.length;
                i++
            ) {
                const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 }); // Column A (barcode)
                if (worksheet[cellRef]) {
                    worksheet[cellRef].t = "s"; // Set type to string
                    worksheet[cellRef].z = "@"; // Set format to text
                }
            }

            // Format HPP (column H, index 7) and Selisih Value (column I, index 8) as currency
            const currencyFormat = "#,##0.00";

            // Format data rows
            for (
                let i = dataStartRow;
                i < dataStartRow + reportData.lines.length;
                i++
            ) {
                // HPP column (H)
                const hppCellRef = XLSX.utils.encode_cell({ r: i, c: 7 });
                if (worksheet[hppCellRef]) {
                    worksheet[hppCellRef].z = currencyFormat;
                }

                // Selisih Value column (I)
                const selisihCellRef = XLSX.utils.encode_cell({ r: i, c: 8 });
                if (worksheet[selisihCellRef]) {
                    worksheet[selisihCellRef].z = currencyFormat;
                }
            }

            // Format summary and total rows
            const summaryStartRow = dataStartRow + reportData.lines.length + 3; // After data + 2 empty rows + Summary label
            for (let i = summaryStartRow; i < summaryStartRow + 4; i++) {
                // 3 summary lines + 1 total
                const selisihCellRef = XLSX.utils.encode_cell({ r: i, c: 8 });
                if (worksheet[selisihCellRef]) {
                    worksheet[selisihCellRef].z = currencyFormat;
                }
            }

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
