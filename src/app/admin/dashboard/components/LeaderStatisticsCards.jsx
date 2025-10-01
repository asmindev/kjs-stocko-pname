import { Package, BarChart3, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATES } from "../constants/states";

export default function LeaderStatisticsCards({ leaderStats }) {
    if (!leaderStats) return null;

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
                        {leaderStats.totalProducts}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Produk dalam tanggung jawab
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
                        {leaderStats.totalQuantity}
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
                        {Object.keys(leaderStats.stateCount).length > 0 ? (
                            Object.entries(leaderStats.stateCount).map(
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
                            )
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                Belum ada data
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Lokasi Tanggung Jawab
                    </CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {leaderStats.responsibleLocations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Lokasi dalam tanggung jawab
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
