"use client";
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { STATES } from "../constants/states";

export default function Dashboard({
    warehouses,
    paginatedProducts,
    pagination,
    locations,
    leaders,
    totalOdooProducts,
    serverStats,
    selectedWarehouse,
    selectedLeader,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Handlers for interactions that change URL params
    const handleWarehouseChange = (warehouse) => {
        const params = new URLSearchParams(searchParams);
        if (warehouse) {
            params.set("warehouse", warehouse.lot_stock_id[0]);
            params.delete("leader"); // Switch mode
            params.delete("page");
        } else {
            params.delete("warehouse");
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleLeaderChange = (leader) => {
        const params = new URLSearchParams(searchParams);
        if (leader) {
            params.set("leader", leader.id);
            params.delete("warehouse"); // Switch mode
            params.delete("page");
        } else {
            params.delete("leader");
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    // Prepare chart data locally from serverStats
    const stateChartData = useMemo(() => {
        if (!serverStats?.stateCount) return [];
        return Object.entries(serverStats.stateCount).map(([state, count]) => {
            const stateConfig = STATES.find((s) => s.label === state) || {
                label: state,
                color: "gray",
            };
            return {
                name: state,
                value: count,
                color: stateConfig.color,
            };
        });
    }, [serverStats]);

    const locationChartData = useMemo(() => {
        if (!serverStats) return [];
        const data = [
            {
                name: "Lokasi Terhitung",
                value: serverStats.locationsWithProducts,
                color: "green",
            },
            {
                name: "Lokasi Belum Terhitung",
                value: serverStats.locationsWithoutProducts,
                color: "red",
            },
        ];
        return data.filter((item) => item.value > 0);
    }, [serverStats]);

    // Determine current active tab/mode based on what is selected
    // If leader is selected, we are in leader mode. If warehouse is selected, warehouse mode.
    // Default to 'warehouse' if neither or warehouse selected.
    // Determine current active tab/mode
    // Priority: 1. URL search param 'tab' 2. Derived from selected props 3. Default to 'warehouse'
    const activeTab =
        searchParams.get("tab") === "leader" || selectedLeader
            ? "leader"
            : "warehouse";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(val) => {
                    // Simple router push with tab parameter
                    router.push(`${pathname}?tab=${val}`);
                }}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="warehouse">
                        Dashboard Warehouse
                    </TabsTrigger>
                    <TabsTrigger value="leader">Statistik Leader</TabsTrigger>
                </TabsList>

                {/* Warehouse Tab */}
                <TabsContent value="warehouse" className="space-y-6">
                    <div className="flex gap-4">
                        <WarehouseSelector
                            warehouses={warehouses}
                            selectedWarehouse={selectedWarehouse}
                            onWarehouseChange={handleWarehouseChange}
                        />
                        <ExportButton selectedWarehouse={selectedWarehouse} />
                    </div>

                    <WarehouseInfo selectedWarehouse={selectedWarehouse} />

                    <StatisticsCards
                        warehouseStats={serverStats} // Passing serverStats which matches structure
                        totalOdooProducts={totalOdooProducts}
                    />

                    <ChartsGrid
                        stateChartData={stateChartData}
                        locationChartData={locationChartData}
                    />

                    <StatusDistribution
                        warehouseStats={serverStats}
                        selectedWarehouse={selectedWarehouse}
                    />

                    {paginatedProducts && paginatedProducts.length > 0 && (
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
                                    {/* ProductsTable needs to handle pagination prop if we pass it, or just render list */}
                                    <ProductsTable
                                        filteredProducts={paginatedProducts}
                                        selectedWarehouse={selectedWarehouse}
                                        pagination={pagination}
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="lokasi"
                                    className="space-y-6"
                                >
                                    <LocationsTable
                                        products={paginatedProducts} // Note: This table shows locations of *paginated* products only?
                                        // LocationsTable usually aggregates products. If only 20 products, table is useless.
                                        // Ideally LocationsTable should use serverStats.locationCount!
                                        // I need to check LocationsTable implementation.
                                        title="Data Lokasi Warehouse"
                                        description={
                                            selectedWarehouse
                                                ? `Daftar lokasi di ${selectedWarehouse.name}`
                                                : "Daftar semua lokasi"
                                        }
                                        serverLocationCounts={
                                            serverStats?.locationCount
                                        } // Pass pre-aggregated data
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {selectedWarehouse &&
                        (!paginatedProducts ||
                            paginatedProducts.length === 0) && (
                            <EmptyState selectedWarehouse={selectedWarehouse} />
                        )}

                    {!selectedWarehouse && <InitialState />}
                </TabsContent>

                {/* Leader Tab */}
                <TabsContent value="leader" className="space-y-6">
                    <LeaderSelector
                        leaders={leaders}
                        selectedLeader={selectedLeader}
                        onLeaderChange={handleLeaderChange}
                    />

                    <LeaderInfo selectedLeader={selectedLeader} />

                    <LeaderStatisticsCards leaderStats={serverStats} />

                    {serverStats &&
                        (stateChartData.length > 0 ||
                            locationChartData.length > 0) && (
                            <ChartsGrid
                                stateChartData={stateChartData}
                                locationChartData={locationChartData}
                            />
                        )}

                    <LeaderStatusDistribution
                        leaderStats={serverStats}
                        leader={selectedLeader} // Component prop name might be leader or selectedLeader
                        selectedLeader={selectedLeader}
                    />

                    {paginatedProducts && paginatedProducts.length > 0 && (
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
                                        filteredProducts={paginatedProducts}
                                        selectedWarehouse={selectedWarehouse} // Or leader context? Table generic?
                                        title="Data Produk Leader"
                                        pagination={pagination}
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
                                        products={paginatedProducts}
                                        serverLocationCounts={
                                            serverStats?.locationCount
                                        }
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

                    {selectedLeader &&
                        (!paginatedProducts ||
                            paginatedProducts.length === 0) && (
                            <EmptyState
                                selectedWarehouse={{
                                    name: selectedLeader.name,
                                }}
                            />
                        )}

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
