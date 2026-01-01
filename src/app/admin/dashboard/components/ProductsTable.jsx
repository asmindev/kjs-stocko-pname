import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/ui/pagination-controls";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProductsTable({
    filteredProducts, // This is now paginatedProducts
    selectedWarehouse,
    title = "Data Produk",
    description,
    pagination,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );

    // Debounce search update to URL
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                const params = new URLSearchParams(searchParams);
                if (searchTerm) {
                    params.set("search", searchTerm);
                } else {
                    params.delete("search");
                }
                params.set("page", "1"); // Reset to page 1
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, pathname, searchParams]);

    // Sync state with URL params
    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
    }, [searchParams]);

    if (!filteredProducts) return null;

    const defaultDescription = selectedWarehouse
        ? `Daftar produk di ${selectedWarehouse.name}`
        : "Daftar semua produk";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <Badge variant="outline">
                        Total {pagination?.total || filteredProducts.length}{" "}
                        produk
                    </Badge>
                </CardTitle>
                <CardDescription>
                    {description || defaultDescription}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Search and Sort */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari berdasarkan nama produk, barcode... (Server Search)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select
                        value={`${searchParams.get("sortBy") || "created_at"}-${
                            searchParams.get("sortOrder") || "desc"
                        }`}
                        onValueChange={(value) => {
                            const [sortBy, sortOrder] = value.split("-");
                            const params = new URLSearchParams(searchParams);
                            params.set("sortBy", sortBy);
                            params.set("sortOrder", sortOrder);
                            params.set("page", "1");
                            router.push(`${pathname}?${params.toString()}`);
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Urutkan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at-desc">
                                Terbaru
                            </SelectItem>
                            <SelectItem value="created_at-asc">
                                Terlama
                            </SelectItem>
                            <SelectItem value="name-asc">
                                Nama Produk (A-Z)
                            </SelectItem>
                            <SelectItem value="location_name-asc">
                                Lokasi (A-Z)
                            </SelectItem>
                            <SelectItem value="warehouse_name-asc">
                                Warehouse (A-Z)
                            </SelectItem>
                            <SelectItem value="quantity-desc">
                                Qty (Banyak-Sedikit)
                            </SelectItem>
                            <SelectItem value="quantity-asc">
                                Qty (Sedikit-Banyak)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">
                                            Produk
                                        </th>
                                        <th className="text-left p-2">
                                            Barcode
                                        </th>
                                        <th className="text-left p-2">Qty</th>
                                        <th className="text-left p-2">UOM</th>
                                        <th className="text-left p-2">
                                            Lokasi
                                        </th>
                                        <th className="text-left p-2">
                                            Status
                                        </th>
                                        <th className="text-left p-2">
                                            Session
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="border-b"
                                        >
                                            <td className="p-2">
                                                <div className="font-medium">
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="p-2 font-mono text-sm">
                                                {product.barcode}
                                            </td>
                                            <td className="p-2">
                                                {product.quantity}
                                            </td>
                                            <td className="p-2">
                                                {product.uom_name}
                                            </td>
                                            <td className="p-2">
                                                <div className="text-sm">
                                                    {product.location_name
                                                        ?.split("/")
                                                        .slice(-2)
                                                        .join("/")}
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <Badge
                                                    variant={
                                                        product.state ===
                                                        "CONFIRMED"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {product.state}
                                                </Badge>
                                            </td>
                                            <td className="p-2">
                                                <div className="text-sm">
                                                    {product.session?.name}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>Tidak ada produk yang ditemukan</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
