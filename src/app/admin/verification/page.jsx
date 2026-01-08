import React from "react";
import { getVerificationData } from "./action";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaginationControls from "@/components/ui/pagination-controls";
import SearchInput from "./search-input";
import { Badge } from "@/components/ui/badge";
import { StatusFilter } from "./status-filter";
import { InventoryCombobox } from "@/components/inventory-combobox";
import { CopyableText } from "@/components/copyable-text";

export default async function Page(props) {
    const searchParams = await props.searchParams;

    // Parse params
    const page = parseInt(searchParams?.page || "1");
    const limit = parseInt(searchParams?.limit || "20");
    const search = searchParams?.q || "";
    const paramInventoryId = searchParams?.inventory_id;
    const status = searchParams?.status;

    // Fetch Data
    const verificationResult = await getVerificationData(
        paramInventoryId,
        page,
        limit,
        search,
        status
    );

    const { success, meta, data, error, inventories } = verificationResult;

    // Determine title based on selection
    let titleSubtitle = "Semua Inventory";
    if (paramInventoryId) {
        const selected = inventories.find(
            (i) => i.id.toString() === paramInventoryId
        );
        if (selected) titleSubtitle = `Inventory: ${selected.name}`;
    }

    // Currency Formatter
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Verifikasi Stock Opname
                    </h1>
                    <p className="text-muted-foreground">
                        Membandingkan data sistem vs hasil scan.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <InventoryCombobox inventories={inventories} />
                    <StatusFilter />
                    <SearchInput placeholder="Cari barcode / produk..." />
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{titleSubtitle}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!success ? (
                        <div className="p-4 text-red-500 bg-red-50 rounded-md">
                            Error: {error || "Gagal memuat data"}
                        </div>
                    ) : (
                        <Table className="w-full caption-bottom text-sm">
                            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        No
                                    </TableHead>
                                    <TableHead>Inventory</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>System</TableHead>
                                    <TableHead>Scan</TableHead>
                                    <TableHead>Selisih</TableHead>
                                    <TableHead className="text-right">
                                        HPP
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Selisih HPP
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Status
                                    </TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead className="w-[50px]">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data && data.length > 0 ? (
                                    data.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                                {item.inventory_name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {item.barcode}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                <CopyableText
                                                    text={item.product_name}
                                                    className="truncate block"
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.system_qty} {item.uom}
                                            </TableCell>
                                            <TableCell className="font-bold text-blue-600">
                                                {item.scanned_qty} {item.uom}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.diff_qty === 0
                                                            ? "secondary"
                                                            : item.diff_qty < 0
                                                            ? "destructive"
                                                            : "default"
                                                    }
                                                    className={
                                                        item.diff_qty === 0
                                                            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                                            : ""
                                                    }
                                                >
                                                    {item.diff_qty > 0
                                                        ? "+"
                                                        : ""}
                                                    {item.diff_qty}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                {formatCurrency(item.hpp)}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-medium whitespace-nowrap ${
                                                    item.hpp_diff < 0
                                                        ? "text-red-600"
                                                        : item.hpp_diff > 0
                                                        ? "text-blue-600"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {formatCurrency(item.hpp_diff)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        item.status ===
                                                        "Positif"
                                                            ? "border-blue-500 text-blue-600"
                                                            : item.status ===
                                                              "Negatif"
                                                            ? "border-red-500 text-red-600"
                                                            : "border-green-500 text-green-600"
                                                    }
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {item.location_name}
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={`/admin/verification/${item.id}/edit`}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-pencil"
                                                    >
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                        <path d="m15 5 4 4" />
                                                    </svg>
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="h-24 text-center"
                                        >
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {meta && (
                        <PaginationControls
                            totalCount={meta.total_items}
                            pageSize={meta.limit}
                            page={meta.current_page}
                            totalPages={meta.total_pages}
                            pageSizeOptions={[20, 50, 80]}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
