"use client";
import React, { useState, useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { ChevronDown, Package, BarChart3, Check } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Dashboard({ warehouses, sessions }) {
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");

    // Filter sessions berdasarkan warehouse yang dipilih
    const filteredSessions = useMemo(() => {
        if (selectedWarehouse === "all") {
            return sessions;
        }
        return sessions.filter((session) => {
            return session.warehouse_id.toString() === selectedWarehouse;
        });
    }, [sessions, selectedWarehouse]);

    // Menghitung data untuk donut chart
    const chartData = useMemo(() => {
        const statusCount = filteredSessions.reduce((acc, session) => {
            acc[session.state] = (acc[session.state] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(statusCount).map(([status, count]) => ({
            name: status,
            value: count,
            percentage: ((count / filteredSessions.length) * 100).toFixed(1),
        }));
    }, [filteredSessions]);

    // Fallback colors jika CSS variables tidak tersedia
    const FALLBACK_COLORS = {
        DRAFT: "#374151", // dark gray
        POST: "#3b82f6", // blue
    };

    // Custom tooltip untuk chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <Card className="shadow-lg border">
                    <CardContent className="p-3">
                        <p className="font-semibold">{data.payload.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Jumlah:{" "}
                            <span className="font-medium">{data.value}</span>{" "}
                            Inventory Adjustments
                        </p>
                        {/* <p className="text-sm text-muted-foreground">
                            Persentase:{" "}
                            <span className="font-medium">
                                {data.payload.percentage}%
                            </span>
                        </p> */}
                    </CardContent>
                </Card>
            );
        }
        return null;
    };

    // Mendapatkan warehouse yang dipilih
    const selectedWarehouseData = warehouses.find(
        (w) => w.lot_stock_id[0].toString() === selectedWarehouse
    );

    return (
        <div className="w-full mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    Dashboard Inventory
                </h1>
                <p className="text-muted-foreground">
                    Overview status Inventory Adjustments berdasarkan warehouse
                </p>
            </div>
            {/* Statistics Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Sessions
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredSessions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedWarehouse === "all"
                                ? "Semua warehouse"
                                : selectedWarehouseData?.name}
                        </p>
                    </CardContent>
                </Card>

                {chartData.map((item) => (
                    <Card key={item.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.name}
                            </CardTitle>
                            <div
                                className="h-4 w-4 rounded-full"
                                style={{
                                    backgroundColor:
                                        FALLBACK_COLORS[item.name] || "#6b7280",
                                }}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {item.value}
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                    {item.percentage}%
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                    {item.name}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Donut Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center  gap-2">
                            <div className="w-full flex justify-between items-center gap-2">
                                <span>Distribusi Status Session</span>
                                {selectedWarehouse !== "all" && (
                                    <Badge variant="outline">
                                        {selectedWarehouseData?.code}
                                    </Badge>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full md:w-fit max-w-md justify-between mt-4 md:mt-0"
                                    >
                                        <span>
                                            {selectedWarehouse === "all"
                                                ? "Semua Warehouse"
                                                : `${selectedWarehouseData?.name} (${selectedWarehouseData?.code})`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setSelectedWarehouse("all")
                                        }
                                        className="flex items-center justify-between"
                                    >
                                        <span>Semua Warehouse</span>
                                        {selectedWarehouse === "all" && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </DropdownMenuItem>
                                    {warehouses.map((warehouse) => (
                                        <DropdownMenuItem
                                            key={warehouse.id}
                                            onClick={() =>
                                                console.log(
                                                    "Selected warehouse:",
                                                    warehouse
                                                ) ||
                                                setSelectedWarehouse(
                                                    warehouse.lot_stock_id[0].toString()
                                                )
                                            }
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex flex-col">
                                                <span>{warehouse.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {warehouse.code}
                                                </span>
                                            </div>
                                            {selectedWarehouse ===
                                                warehouse.id.toString() && (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        {selectedWarehouse === "all"
                            ? "Menampilkan semua Inventory Adjustments dari seluruh warehouse"
                            : `Data Inventory Adjustments untuk ${selectedWarehouseData?.name}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredSessions.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chart */}
                            <div className="lg:col-span-2">
                                <div className="h-96">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={140}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {chartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                FALLBACK_COLORS[
                                                                    entry.name
                                                                ] || "#6b7280"
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-4">
                                <h4 className="font-semibold">Detail Status</h4>
                                <div className="space-y-3">
                                    {chartData.map((entry) => (
                                        <Card key={entry.name} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-3 w-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                FALLBACK_COLORS[
                                                                    entry.name
                                                                ] || "#6b7280",
                                                        }}
                                                    />
                                                    <span className="font-medium">
                                                        {entry.name}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {entry.value}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.percentage}%
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Tidak ada data
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                                {selectedWarehouse === "all"
                                    ? "Belum ada session yang tersedia di sistem"
                                    : `Belum ada session untuk warehouse ${selectedWarehouseData?.name}`}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
