import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getChartColor } from "../constants/states";

export default function ChartsGrid({ stateChartData, locationChartData }) {
    if (!stateChartData.length && !locationChartData.length) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State Distribution Chart */}
            {stateChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Status Produk</CardTitle>
                        <CardDescription>
                            Pembagian produk berdasarkan status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stateChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) =>
                                        `${name}: ${value} (${(
                                            percent * 100
                                        ).toFixed(0)}%)`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stateChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getChartColor(entry.color)}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Location Distribution Chart */}
            {locationChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Lokasi</CardTitle>
                        <CardDescription>
                            Pembagian lokasi berdasarkan status perhitungan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={locationChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) =>
                                        `${name}: ${value} (${(
                                            percent * 100
                                        ).toFixed(0)}%)`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {locationChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getChartColor(entry.color)}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
