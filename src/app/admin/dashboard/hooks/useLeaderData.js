import { useMemo } from "react";
import { STATES } from "../constants/states";

export const useLeaderData = (products, selectedLeader, locations) => {
    // Get leader's responsible location IDs
    const leaderLocationIds = useMemo(() => {
        if (!selectedLeader) return [];
        return selectedLeader.inventory_product_location_ids || [];
    }, [selectedLeader]);

    // Get location details for leader's responsible locations
    const leaderLocations = useMemo(() => {
        if (!leaderLocationIds.length) return [];
        return locations.filter((location) =>
            leaderLocationIds.includes(location.id)
        );
    }, [locations, leaderLocationIds]);

    // Filter products based on leader's responsible locations
    console.log("leaderLocationIds:", leaderLocationIds);
    const leaderProducts = useMemo(() => {
        if (!selectedLeader || !leaderLocationIds.length) return [];

        return products.filter((product) => {
            // Filter products directly by location_id
            return leaderLocationIds.includes(product.location_id);
        });
    }, [products, selectedLeader, leaderLocationIds]);

    // Calculate statistics for leader
    const leaderStats = useMemo(() => {
        if (!selectedLeader) return null;

        const totalProducts = leaderProducts.length;
        const totalQuantity = leaderProducts.reduce(
            (sum, product) => sum + product.quantity,
            0
        );

        // Group by state
        const stateCount = leaderProducts.reduce((acc, product) => {
            acc[product.state] = (acc[product.state] || 0) + 1;
            return acc;
        }, {});

        // Group by location
        const locationCount = leaderProducts.reduce((acc, product) => {
            const locationName = product.location_name || "Unknown";
            acc[locationName] = (acc[locationName] || 0) + product.quantity;
            return acc;
        }, {});

        // Get locations that have products
        const locationsWithProducts = [
            ...new Set(leaderProducts.map((p) => p.location_name)),
        ];

        // Calculate locations without products (BELUM_DIHITUNG)
        const locationsWithoutProducts = leaderLocations.filter(
            (location) => !locationsWithProducts.includes(location.display_name)
        );

        // Calculate state percentages
        const statePercentages = {};
        if (totalProducts > 0) {
            Object.entries(stateCount).forEach(([state, count]) => {
                statePercentages[state] = (
                    (count / totalProducts) *
                    100
                ).toFixed(1);
            });
        }

        return {
            totalProducts,
            totalQuantity,
            stateCount,
            statePercentages,
            locationCount,
            responsibleLocations: leaderLocations.length,
            locationsWithProducts: locationsWithProducts.length,
            locationsWithoutProducts: locationsWithoutProducts.length,
            uncountedLocations: locationsWithoutProducts,
        };
    }, [leaderProducts, selectedLeader, leaderLocations]);

    // Prepare chart data for state distribution
    const leaderStateChartData = useMemo(() => {
        if (!leaderStats?.stateCount) return [];

        return Object.entries(leaderStats.stateCount).map(([state, count]) => {
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
    }, [leaderStats]);

    // Prepare chart data for location distribution
    const leaderLocationChartData = useMemo(() => {
        if (!leaderStats) return [];

        const data = [
            {
                name: "Lokasi Terhitung",
                value: leaderStats.locationsWithProducts,
                color: "green",
            },
            {
                name: "Lokasi Belum Terhitung",
                value: leaderStats.locationsWithoutProducts,
                color: "red",
            },
        ];

        return data.filter((item) => item.value > 0);
    }, [leaderStats]);

    return {
        leaderProducts,
        leaderStats,
        leaderStateChartData,
        leaderLocationChartData,
        leaderLocations,
    };
};
