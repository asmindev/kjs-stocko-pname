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

export default function LocationsTable({
    products = [],
    title = "Data Lokasi",
    description,
}) {
    const [searchTerm, setSearchTerm] = useState("");

    // Group products by location
    const locationSummary = products.reduce((acc, product) => {
        const locationName = product.location_name || "Unknown";

        if (!acc[locationName]) {
            acc[locationName] = {
                locationName,
                locationId: product.location_id,
                totalProducts: 0,
                totalQuantity: 0,
                states: {},
                sessions: new Set(),
            };
        }

        acc[locationName].totalProducts += 1;
        acc[locationName].totalQuantity += product.quantity;
        acc[locationName].states[product.state] =
            (acc[locationName].states[product.state] || 0) + 1;
        if (product.session?.name) {
            acc[locationName].sessions.add(product.session.name);
        }

        return acc;
    }, {});

    const locationData = Object.values(locationSummary).sort(
        (a, b) => b.totalQuantity - a.totalQuantity
    );

    // Filter locations based on search term
    const searchedLocations = useMemo(() => {
        if (!searchTerm) return locationData;

        return locationData.filter(
            (location) =>
                location.locationName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                location.locationId?.toString().includes(searchTerm) ||
                Object.keys(location.states).some((state) =>
                    state.toLowerCase().includes(searchTerm.toLowerCase())
                )
        );
    }, [locationData, searchTerm]);

    if (!products || !locationData.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <Badge variant="outline">
                        {searchedLocations.length} dari {locationData.length}{" "}
                        lokasi
                    </Badge>
                </CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {/* Search Input */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari berdasarkan nama lokasi, ID lokasi, atau status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Results Info */}
                {searchTerm && (
                    <div className="mb-4 text-sm text-gray-600">
                        {searchedLocations.length > 0
                            ? `Menampilkan ${searchedLocations.length} hasil dari pencarian "${searchTerm}"`
                            : `Tidak ada hasil untuk pencarian "${searchTerm}"`}
                    </div>
                )}

                {/* Table */}
                {searchedLocations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Lokasi</th>
                                    <th className="text-left p-2">
                                        Total Produk
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchedLocations.map((location) => (
                                    <tr
                                        key={location.locationName}
                                        className="border-b"
                                    >
                                        <td className="p-2">
                                            <div className="font-medium">
                                                {location.locationName
                                                    ?.split("/")
                                                    .slice(-2)
                                                    .join("/")}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {location.locationName}
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="font-semibold">
                                                {location.totalQuantity}
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
                        <p>Tidak ada lokasi yang ditemukan</p>
                        <p className="text-sm mt-1">
                            Coba gunakan kata kunci yang berbeda
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
