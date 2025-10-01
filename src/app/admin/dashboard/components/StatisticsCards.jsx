import { Package, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATES } from "../constants/states";

export default function StatisticsCards({ warehouseStats }) {
    if (!warehouseStats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Produk
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {warehouseStats.totalProducts}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Jumlah item produk
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Quantity
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {warehouseStats.totalQuantity}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total kuantitas
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(warehouseStats.stateCount).map(
                            ([state, count]) => {
                                const stateConfig = STATES.find(
                                    (s) => s.label === state
                                ) || { label: state, color: "gray" };
                                return (
                                    <Badge
                                        key={state}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {state}: {count}
                                    </Badge>
                                );
                            }
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Lokasi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {warehouseStats.warehouseLocations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Lokasi di warehouse
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
