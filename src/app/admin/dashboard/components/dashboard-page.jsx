"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "../hooks/useDashboardData";
import { useLeaderData } from "../hooks/useLeaderData";
import {
    WarehouseSelector,
    WarehouseInfo,
    StatisticsCards,
    ChartsGrid,
    StatusDistribution,
    ProductsTable,
    LocationsTable,
    ExportButton,
    EmptyState,
    InitialState,
    LeaderSelector,
    LeaderInfo,
    LeaderStatisticsCards,
    LeaderStatusDistribution,
} from "./index";

export default function Dashboard({
    warehouses,
    products,
    locations,
    leaders,
}) {
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [selectedLeader, setSelectedLeader] = useState(null);

    const {
        filteredProducts,
        warehouseStats,
        stateChartData,
        locationChartData,
    } = useDashboardData(products, selectedWarehouse, locations);

    const {
        leaderProducts,
        leaderStats,
        leaderStateChartData,
        leaderLocationChartData,
        leaderLocations,
    } = useLeaderData(products, selectedLeader, locations);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="warehouse" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="warehouse">
                        Dashboard Warehouse
                    </TabsTrigger>
                    <TabsTrigger value="leader">Statistik Leader</TabsTrigger>
                </TabsList>

                {/* Warehouse Tab */}
                <TabsContent value="warehouse" className="space-y-6">
                    {/* Warehouse Selector */}
                    <div className="flex gap-4">
                        <WarehouseSelector
                            warehouses={warehouses}
                            selectedWarehouse={selectedWarehouse}
                            onWarehouseChange={setSelectedWarehouse}
                        />
                        <ExportButton />
                    </div>
                    {/* Selected Warehouse Info */}
                    <WarehouseInfo selectedWarehouse={selectedWarehouse} />
                    {/* Statistics Cards */}
                    <StatisticsCards warehouseStats={warehouseStats} />
                    {/* Charts */}
                    <ChartsGrid
                        stateChartData={stateChartData}
                        locationChartData={locationChartData}
                    />
                    {/* Status Distribution Info */}
                    <StatusDistribution
                        warehouseStats={warehouseStats}
                        selectedWarehouse={selectedWarehouse}
                    />
                    {/* Products Section with Tabs */}
                    {filteredProducts.length > 0 && (
                        <div className="grid gap-6">
                            <Tabs defaultValue="produk" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="produk">
                                        Produk
                                    </TabsTrigger>
                                    <TabsTrigger value="lokasi">
                                        Lokasi
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="produk"
                                    className="space-y-6"
                                >
                                    <ProductsTable
                                        filteredProducts={filteredProducts}
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="lokasi"
                                    className="space-y-6"
                                >
                                    <LocationsTable
                                        products={filteredProducts}
                                        title="Data Lokasi Warehouse"
                                        description={
                                            selectedWarehouse
                                                ? `Daftar lokasi di ${selectedWarehouse.name}`
                                                : "Daftar semua lokasi"
                                        }
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}{" "}
                    {/* Empty State */}
                    {selectedWarehouse && filteredProducts.length === 0 && (
                        <EmptyState selectedWarehouse={selectedWarehouse} />
                    )}
                    {/* Initial State - Select Warehouse Info */}
                    {!selectedWarehouse && <InitialState />}
                </TabsContent>

                {/* Leader Tab */}
                <TabsContent value="leader" className="space-y-6">
                    {/* Leader Selector */}
                    <div className="flex gap-4">
                        <LeaderSelector
                            leaders={leaders}
                            selectedLeader={selectedLeader}
                            onLeaderChange={setSelectedLeader}
                        />
                        <ExportButton />
                    </div>

                    {/* Selected Leader Info */}
                    <LeaderInfo selectedLeader={selectedLeader} />

                    {/* Leader Statistics Cards */}
                    <LeaderStatisticsCards leaderStats={leaderStats} />

                    {/* Leader Charts */}
                    {leaderStats &&
                        (leaderStateChartData.length > 0 ||
                            leaderLocationChartData.length > 0) && (
                            <ChartsGrid
                                stateChartData={leaderStateChartData}
                                locationChartData={leaderLocationChartData}
                            />
                        )}

                    {/* Leader Status Distribution Info */}
                    <LeaderStatusDistribution
                        leaderStats={leaderStats}
                        selectedLeader={selectedLeader}
                    />

                    {/* Leader Products Section with Tabs */}
                    {leaderProducts.length > 0 && (
                        <div className="grid gap-6">
                            <Tabs defaultValue="produk" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="produk">
                                        Produk
                                    </TabsTrigger>
                                    <TabsTrigger value="lokasi">
                                        Lokasi
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="produk"
                                    className="space-y-6"
                                >
                                    <ProductsTable
                                        filteredProducts={leaderProducts}
                                        title="Data Produk Leader"
                                        description={
                                            selectedLeader
                                                ? `Daftar produk dalam tanggung jawab ${selectedLeader.name}`
                                                : "Daftar semua produk leader"
                                        }
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="lokasi"
                                    className="space-y-6"
                                >
                                    <LocationsTable
                                        products={leaderProducts}
                                        title="Data Lokasi Leader"
                                        description={
                                            selectedLeader
                                                ? `Daftar lokasi dalam tanggung jawab ${selectedLeader.name}`
                                                : "Daftar semua lokasi leader"
                                        }
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Leader Empty State */}
                    {selectedLeader && leaderProducts.length === 0 && (
                        <EmptyState
                            selectedWarehouse={{ name: selectedLeader.name }}
                        />
                    )}

                    {/* Leader Initial State */}
                    {!selectedLeader && (
                        <InitialState
                            title="Pilih Leader untuk Melihat Data"
                            description="Silakan pilih leader dari dropdown di atas untuk menampilkan data produk, statistik, dan analisis berdasarkan lokasi tanggung jawab leader."
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
