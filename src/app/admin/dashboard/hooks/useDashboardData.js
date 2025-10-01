import { useMemo } from "react";
import { STATES } from "../constants/states";

export const useDashboardData = (products, selectedWarehouse, locations) => {
    // Filter products based on selected warehouse
    const filteredProducts = useMemo(() => {
        if (!selectedWarehouse) return [];
        return products.filter(
            (product) =>
                product.session?.warehouse_id ===
                selectedWarehouse.lot_stock_id[0]
        );
    }, [products, selectedWarehouse]);

    // Calculate statistics for selected warehouse
    const warehouseStats = useMemo(() => {
        if (!filteredProducts.length || !selectedWarehouse) return null;

        const totalProducts = filteredProducts.length;
        const totalQuantity = filteredProducts.reduce(
            (sum, product) => sum + product.quantity,
            0
        );

        // Group by state
        const stateCount = filteredProducts.reduce((acc, product) => {
            acc[product.state] = (acc[product.state] || 0) + 1;
            return acc;
        }, {});

        // Group by location
        const locationCount = filteredProducts.reduce((acc, product) => {
            const locationName = product.location_name || "Unknown";
            acc[locationName] = (acc[locationName] || 0) + product.quantity;
            return acc;
        }, {});

        // Get all locations for selected warehouse
        const warehouseLocations = locations.filter(
            (location) =>
                location.stock_location_id[0] ===
                selectedWarehouse.lot_stock_id[0]
        );

        // Get locations that have products
        const locationsWithProducts = [
            ...new Set(filteredProducts.map((p) => p.location_name)),
        ];

        // Calculate locations without products (BELUM_DIHITUNG)
        const locationsWithoutProducts = warehouseLocations.filter(
            (location) => !locationsWithProducts.includes(location.display_name)
        );

        // Calculate state percentages
        const statePercentages = {};
        Object.entries(stateCount).forEach(([state, count]) => {
            statePercentages[state] = ((count / totalProducts) * 100).toFixed(
                1
            );
        });

        return {
            totalProducts,
            totalQuantity,
            stateCount,
            statePercentages,
            locationCount,
            warehouseLocations: warehouseLocations.length,
            locationsWithProducts: locationsWithProducts.length,
            locationsWithoutProducts: locationsWithoutProducts.length,
            uncountedLocations: locationsWithoutProducts,
        };
    }, [filteredProducts, selectedWarehouse, locations]);

    // Prepare chart data for state distribution
    const stateChartData = useMemo(() => {
        if (!warehouseStats?.stateCount) return [];

        return Object.entries(warehouseStats.stateCount).map(
            ([state, count]) => {
                const stateConfig = STATES.find((s) => s.label === state) || {
                    label: state,
                    color: "gray",
                };
                return {
                    name: state,
                    value: count,
                    color: stateConfig.color,
                };
            }
        );
    }, [warehouseStats]);

    // Prepare chart data for location distribution
    const locationChartData = useMemo(() => {
        if (!warehouseStats) return [];

        const data = [
            {
                name: "Lokasi Terhitung",
                value: warehouseStats.locationsWithProducts,
                color: "green",
            },
            {
                name: "Lokasi Belum Terhitung",
                value: warehouseStats.locationsWithoutProducts,
                color: "red",
            },
        ];

        return data.filter((item) => item.value > 0);
    }, [warehouseStats]);

    return {
        filteredProducts,
        warehouseStats,
        stateChartData,
        locationChartData,
    };
};
