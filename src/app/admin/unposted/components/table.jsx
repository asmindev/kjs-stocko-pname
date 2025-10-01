"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { actionPostToOdoo } from "../post_to_odoo.action";

export default function UnpostedGroupedTable({ data }) {
    const router = useRouter();
    const flatRows = useMemo(() => {
        const rows = [];
        for (const wh of data || []) {
            for (const prod of wh.products || []) {
                rows.push({
                    key: `${wh.warehouse_id}-${prod.key}`,
                    product: prod.name,
                    warehouse:
                        wh.warehouse_name || `Warehouse ${wh.warehouse_id}`,
                    warehouseId: wh.warehouse_id,
                    qty: prod.quantity,
                    targetUom: prod.targetUom,
                    originalUom: prod.originalUom,
                    needsConversion: prod.needsConversion,
                    details: prod.data || [],
                });
            }
        }
        return rows;
    }, [data]);

    const [selectedWarehouse, setSelectedWarehouse] = useState("all");

    const warehouses = useMemo(() => {
        const unique = new Set();
        const list = [];
        for (const wh of data || []) {
            const key = `${wh.warehouse_id}-${wh.warehouse_name}`;
            if (!unique.has(key)) {
                unique.add(key);
                list.push({
                    id: wh.warehouse_id,
                    name: wh.warehouse_name || `Warehouse ${wh.warehouse_id}`,
                });
            }
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    const filteredRows = useMemo(() => {
        if (selectedWarehouse === "all") return flatRows;
        return flatRows.filter(
            (row) => row.warehouseId.toString() === selectedWarehouse
        );
    }, [flatRows, selectedWarehouse]);

    const handleRowClick = (row) => {
        const params = new URLSearchParams({
            warehouseId: row.warehouseId.toString(),
            productKey: row.key, // Use the full key as productKey
        });

        router.push(`/admin/unposted/details?${params.toString()}`);
    };

    if (!data || data.length === 0) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Unposted</CardTitle>
                    <CardDescription>
                        Dokumen yang belum diposting ke Odoo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Tidak ada dokumen terkonfirmasi.
                    </div>
                </CardContent>
            </Card>
        );
    }
    const postToOdoo = async () => {
        if (selectedWarehouse === "all") {
            toast.error("Silakan pilih warehouse terlebih dahulu.");
            return;
        }
        const dataToPost = filteredRows.filter(
            (row) => row.warehouseId.toString() === selectedWarehouse
        );
        if (dataToPost.length === 0) {
            toast.error("Tidak ada data untuk diposting di warehouse ini.");
            return;
        }
        console.log("Data to be posted to Odoo:", dataToPost[0]);

        try {
            const result = toast.promise(
                actionPostToOdoo({ data: dataToPost }),
                {
                    loading: "Memproses data...",
                    success: (data) => {
                        if (data.success) {
                            // Show detailed success message with results
                            const successMsg =
                                data.message ||
                                "Data berhasil diposting ke Odoo!";
                            const details = data.details
                                ? ` (${data.details})`
                                : "";

                            // If there are errors, show them as warning
                            if (data.results?.error?.length > 0) {
                                setTimeout(() => {
                                    toast.warning(
                                        `Beberapa produk gagal diproses`,
                                        {
                                            description: `${
                                                data.results.error.length
                                            } produk gagal: ${data.results.error
                                                .map(
                                                    (e) =>
                                                        `ID ${e.product_id}: ${e.error}`
                                                )
                                                .join(", ")}`,
                                            duration: 8000,
                                        }
                                    );
                                }, 1000);
                            }

                            return successMsg + details;
                        } else {
                            return (
                                data.message || "Gagal memposting data ke Odoo."
                            );
                        }
                    },
                    error: (error) => {
                        console.error("Post to Odoo error:", error);
                        return (
                            error.message || "Gagal memposting data ke Odoo."
                        );
                    },
                }
            );

            // Show detailed results if available
            if (result?.results) {
                console.log("Post results:", result.results);

                // Show success details
                if (result.results.success?.length > 0) {
                    setTimeout(() => {
                        toast.success(
                            `${result.results.success.length} produk berhasil diproses`,
                            {
                                description: `Produk ID: ${result.results.success
                                    .map((s) => s.product_id)
                                    .join(", ")}`,
                                duration: 5000,
                            }
                        );
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("Error posting to Odoo:", error);

            // Try to extract detailed error information
            if (error?.results) {
                const errorCount = error.results.error?.length || 0;
                const successCount = error.results.success?.length || 0;

                if (errorCount > 0) {
                    const errorDetails = error.results.error
                        .map((e) => `ID ${e.product_id}: ${e.error}`)
                        .slice(0, 3) // Show max 3 errors
                        .join("\n");

                    toast.error(`Gagal memproses ${errorCount} produk`, {
                        description:
                            errorDetails +
                            (errorCount > 3 ? "\n...dan lainnya" : ""),
                        duration: 10000,
                    });
                }

                if (successCount > 0) {
                    toast.info(`${successCount} produk berhasil diproses`, {
                        description: `Meski ada error, beberapa produk tetap berhasil`,
                        duration: 5000,
                    });
                }
            } else {
                toast.error("Gagal memposting data ke Odoo", {
                    description:
                        error.message ||
                        "Terjadi kesalahan yang tidak diketahui",
                    duration: 8000,
                });
            }
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex flex-col md:items-end md:justify-end gap-4">
                    <div className="w-full flex items-center gap-2 justify-between">
                        <div>
                            <CardTitle>Unposted</CardTitle>
                            <CardDescription>
                                Ringkasan per produk dan warehouse
                            </CardDescription>
                        </div>
                        <div>
                            <Button size="sm" onClick={() => postToOdoo()}>
                                POST TO ODOO
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">
                            Filter Warehouse:
                        </label>
                        <Select
                            value={selectedWarehouse}
                            onValueChange={setSelectedWarehouse}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Pilih warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Warehouse
                                </SelectItem>
                                {warehouses.map((wh) => (
                                    <SelectItem
                                        key={wh.id}
                                        value={wh.id.toString()}
                                    >
                                        {wh.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[5px]">#</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Total Qty</TableHead>
                                <TableHead>UOM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRows.map((row, idx) => (
                                <TableRow
                                    key={row.key}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(row)}
                                >
                                    <TableCell className="font-medium">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell>{row.product}</TableCell>
                                    <TableCell>{row.warehouse}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {row.qty}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                {row.needsConversion
                                                    ? row.targetUom?.name ||
                                                      "Unitt"
                                                    : row.originalUom?.name ||
                                                      "Units"}
                                            </Badge>
                                            {row.needsConversion && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 text-xs"
                                                >
                                                    Converted
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
