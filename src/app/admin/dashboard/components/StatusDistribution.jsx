import { Package } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { STATES, getChartColor } from "../constants/states";

export default function StatusDistribution({
    warehouseStats,
    selectedWarehouse,
}) {
    if (!warehouseStats) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Status Produk</CardTitle>
                <CardDescription>
                    Persentase produk berdasarkan status di warehouse{" "}
                    {selectedWarehouse?.name}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(warehouseStats.stateCount).map(
                        ([state, count]) => {
                            const stateConfig = STATES.find(
                                (s) => s.label === state
                            ) || { label: state, color: "gray" };
                            const percentage =
                                warehouseStats.statePercentages[state];

                            return (
                                <div
                                    key={state}
                                    className="text-center p-3 border rounded-lg"
                                >
                                    <div
                                        className="text-lg font-bold"
                                        style={{
                                            color: getChartColor(
                                                stateConfig.color
                                            ),
                                        }}
                                    >
                                        {count}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {state}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {percentage}% dari total
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>

                {warehouseStats.locationsWithoutProducts > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                            <Package className="h-4 w-4" />
                            Lokasi Belum Dihitung
                        </div>
                        <div className="text-sm text-red-600">
                            Terdapat{" "}
                            <strong>
                                {warehouseStats.locationsWithoutProducts}
                            </strong>{" "}
                            lokasi dari total{" "}
                            <strong>{warehouseStats.warehouseLocations}</strong>{" "}
                            lokasi yang belum memiliki data produk terhitung.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
