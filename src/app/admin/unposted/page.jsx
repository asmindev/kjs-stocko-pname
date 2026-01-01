import React from "react";
import { getUnpostedProducts, getWarehousesList } from "./actions";
import UnpostedGroupedTable from "./components/table";

export default async function Page({ searchParams }) {
    const { page, limit, warehouse, search } = searchParams;

    // Parallel fetch
    const [unpostedData, warehouses] = await Promise.all([
        getUnpostedProducts({
            page,
            limit,
            warehouseId: warehouse,
            search,
        }),
        getWarehousesList(),
    ]);

    const { paginatedRows, totalCount, totalPages } = unpostedData;

    return (
        <UnpostedGroupedTable
            data={paginatedRows}
            warehousesList={warehouses.map((w) => ({
                id: w.lot_stock_id[0],
                name: w.display_name || w.name,
            }))}
            pagination={{
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                total: totalCount,
                totalPages,
            }}
            searchParams={{
                search: search || "",
                warehouse: warehouse || "all",
            }}
        />
    );
}
