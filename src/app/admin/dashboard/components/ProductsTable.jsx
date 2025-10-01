import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function ProductsTable({
    filteredProducts,
    selectedWarehouse,
    title = "Data Produk",
    description,
}) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter products based on search term
    const searchedProducts = useMemo(() => {
        if (!searchTerm) return filteredProducts;

        return filteredProducts.filter(
            (product) =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.barcode
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                product.location_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                product.state
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                product.session?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );
    }, [filteredProducts, searchTerm]);

    if (!filteredProducts.length) return null;

    const defaultDescription = selectedWarehouse
        ? `Daftar produk di ${selectedWarehouse.name}`
        : "Daftar semua produk";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <Badge variant="outline">
                        {searchedProducts.length} dari {filteredProducts.length}{" "}
                        produk
                    </Badge>
                </CardTitle>
                <CardDescription>
                    {description || defaultDescription}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Search Input */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari berdasarkan nama produk, barcode, lokasi, status, atau session..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Results Info */}
                {searchTerm && (
                    <div className="mb-4 text-sm text-gray-600">
                        {searchedProducts.length > 0
                            ? `Menampilkan ${searchedProducts.length} hasil dari pencarian "${searchTerm}"`
                            : `Tidak ada hasil untuk pencarian "${searchTerm}"`}
                    </div>
                )}

                {/* Table */}
                {searchedProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Produk</th>
                                    <th className="text-left p-2">Barcode</th>
                                    <th className="text-left p-2">Qty</th>
                                    <th className="text-left p-2">UOM</th>
                                    <th className="text-left p-2">Lokasi</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-left p-2">Session</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchedProducts.map((product) => (
                                    <tr key={product.id} className="border-b">
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
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>Tidak ada produk yang ditemukan</p>
                        <p className="text-sm mt-1">
                            Coba gunakan kata kunci yang berbeda
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
