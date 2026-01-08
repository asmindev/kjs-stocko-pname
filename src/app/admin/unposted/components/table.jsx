"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Added hooks
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
import { Input } from "@/components/ui/input"; // Import Input
import { toast } from "sonner";
import { actionBatchPostToOdoo } from "../post_to_odoo.action";
import PaginationControls from "@/components/ui/pagination-controls"; // Import Pagination
import { Search } from "lucide-react"; // Import Search Icon
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, X } from "lucide-react"; // Import Icons

export default function UnpostedGroupedTable({
    data,
    warehousesList,
    pagination,
    searchParams,
    maxPostLines = 500, // Default to 500 if not provided
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchQuery = useSearchParams(); // Use hook for URL manipulation

    const [searchTerm, setSearchTerm] = useState(searchParams?.search || "");
    const [selectedWarehouse, setSelectedWarehouse] = useState(
        searchParams?.warehouse || "all"
    );
    const [postResult, setPostResult] = useState(null); // State for post result

    // Sync Search with URL
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchQuery.get("search") || "")) {
                const params = new URLSearchParams(searchQuery);
                if (searchTerm) {
                    params.set("search", searchTerm);
                } else {
                    params.delete("search");
                }
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, pathname, searchQuery]);

    // Sync state from props (for back/forward navigation)
    useEffect(() => {
        setSearchTerm(searchParams?.search || "");
        setSelectedWarehouse(searchParams?.warehouse || "all");
    }, [searchParams]);

    // Handle Warehouse Change
    const handleWarehouseChange = (value) => {
        setSelectedWarehouse(value);
        const params = new URLSearchParams(searchQuery);
        if (value && value !== "all") {
            params.set("warehouse", value);
        } else {
            params.delete("warehouse");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRowClick = (row) => {
        const params = new URLSearchParams({
            warehouseId: row.warehouseId.toString(),
            productKey: row.key.split("-").slice(1).join("-"), // Extract productKey from full key (warehouseId-productKey)
            // Note: The key is constructed as `${wh.warehouse_id}-${prod.key}` in action.
            // prod.key = `${p.product_id ?? barcode ?? name}`.
            // Details page expects productKey to start with identifier.
            // Previous code: `productKey: row.key` passed the full key?
            // Previous logic: `key: ${wh.warehouse_id}-${prod.key}`.
            // Action `getProductDetails` splits by `-`. `productIdentifier = productKey.split("-")[1]`.
            // So passing `row.key` works IF warehouseId doesn't have dashes.
            // But strict split is `productKey.split("-")[1]`.
            // If `row.key` is "1-123", split is ["1", "123"]. Identifier "123". Correct.
            // So passing `row.key` is fine if we match action logic.
        });
        // Wait, action logic: `const productIdentifier = productKey.split("-")[1];`
        // If productKey (param) is "1-SKU-123", split[1] is "SKU". Wrong.
        // It seems `productKey` in action implies format `WHID-PRODID`.

        router.push(
            `/admin/unposted/details?warehouseId=${row.warehouseId}&productKey=${row.key}`
        );
    };

    if (!data || data.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow">
                    <div className="w-full md:w-1/3 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">
                            Filter Warehouse:
                        </label>
                        <Select
                            value={selectedWarehouse}
                            onValueChange={handleWarehouseChange}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Pilih warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Warehouse
                                </SelectItem>
                                {warehousesList?.map((w) => (
                                    <SelectItem
                                        key={w.id}
                                        value={w.id.toString()}
                                    >
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Unposted</CardTitle>
                        <CardDescription>
                            Tidak ada dokumen terkonfirmasi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground py-8">
                            Tidak ada data untuk ditampilkan.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handlePostToOdoo = async () => {
        if (selectedWarehouse === "all") {
            toast.error(
                "Silakan pilih warehouse terlebih dahulu untuk posting (Fitur posting batch per warehouse)."
            );
            return;
        }

        // Confirmation dialog is now handled by AlertDialog UI
        // Triggered by Continue action

        try {
            const result = toast.promise(
                actionBatchPostToOdoo({ warehouseId: selectedWarehouse }),
                {
                    loading: `Memproses batch posting ke Odoo (Max ${maxPostLines} item)...`,
                    success: (res) => {
                        if (res.success) {
                            setPostResult({
                                type: "success",
                                message: res.message,
                                details: res.details,
                            });

                            if (res.results?.error?.length > 0) {
                                return `Berhasil posting ${res.results.success.length} item. ${res.results.error.length} gagal.`;
                            }
                            return res.message || "Berhasil posting batch!";
                        } else {
                            throw new Error(res.message);
                        }
                    },
                    error: (err) => {
                        setPostResult({
                            type: "error",
                            message: err.message || "Gagal posting.",
                        });
                        return err.message || "Gagal posting.";
                    },
                }
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex flex-col gap-4">
                    {/* Post Result Alert */}
                    {postResult && (
                        <Alert
                            variant={
                                postResult.type === "success"
                                    ? "default"
                                    : "destructive"
                            }
                            className={
                                postResult.type === "success"
                                    ? "order-green-500 bg-green-50 relative"
                                    : "relative"
                            }
                        >
                            <button
                                onClick={() => setPostResult(null)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {postResult.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle
                                className={
                                    postResult.type === "success"
                                        ? "text-green-800"
                                        : ""
                                }
                            >
                                {postResult.type === "success"
                                    ? "Berhasil Diposting"
                                    : "Gagal Posting"}
                            </AlertTitle>
                            <AlertDescription
                                className={
                                    postResult.type === "success"
                                        ? "text-green-700"
                                        : ""
                                }
                            >
                                <div className="flex flex-col gap-1">
                                    <p>{postResult.message}</p>
                                    {postResult.details && (
                                        <div className="text-xs mt-1 font-mono bg-green-100 p-2 rounded">
                                            {typeof postResult.details ===
                                            "object" ? (
                                                <ul className="list-disc list-inside">
                                                    <li>
                                                        Total:{" "}
                                                        {
                                                            postResult.details
                                                                .totalProcessed
                                                        }
                                                    </li>
                                                    <li>
                                                        Success:{" "}
                                                        {
                                                            postResult.details
                                                                .successCount
                                                        }
                                                    </li>
                                                    <li>
                                                        Error:{" "}
                                                        {
                                                            postResult.details
                                                                .errorCount
                                                        }
                                                    </li>
                                                </ul>
                                            ) : (
                                                postResult.details
                                            )}
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Unposted</CardTitle>
                            <CardDescription>
                                Ringkasan per produk dan warehouse
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm">
                                        POST BATCH TO ODOO (Max {maxPostLines})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Posting ke Odoo?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Apakah Anda yakin ingin memposting
                                            data unposted untuk warehouse
                                            terpilih? Sistem akan mengambil
                                            maksimal {maxPostLines} item
                                            CONFIRMED dan mempostingnya sebagai
                                            Inventory Adjustment di Odoo.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Batal
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handlePostToOdoo()}
                                        >
                                            Lanjutkan
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                                Filter Warehouse:
                            </label>
                            <Select
                                value={selectedWarehouse}
                                onValueChange={handleWarehouseChange}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Pilih warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Warehouse
                                    </SelectItem>
                                    {warehousesList?.map((w) => (
                                        <SelectItem
                                            key={w.id}
                                            value={w.id.toString()}
                                        >
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
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
                                {data.map((row, idx) => (
                                    <TableRow
                                        key={row.key}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(row)}
                                    >
                                        <TableCell className="font-medium">
                                            {((pagination?.page || 1) - 1) *
                                                (pagination?.limit || 20) +
                                                idx +
                                                1}
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
                                                          "Unit"
                                                        : row.originalUom
                                                              ?.name || "Units"}
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
                    {pagination && (
                        <PaginationControls
                            totalCount={pagination.total}
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            limit={pagination.limit}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
