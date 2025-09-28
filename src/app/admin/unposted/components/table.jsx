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
import { actionPostToOdoo } from "../actions";

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
        // Implement the logic to post data to Odoo
        toast.promise(actionPostToOdoo({ data: dataToPost }), {
            loading: "Memproses data...",
            success: "Data berhasil diposting ke Odoo!",
            error: "Gagal memposting data ke Odoo.",
        });
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
