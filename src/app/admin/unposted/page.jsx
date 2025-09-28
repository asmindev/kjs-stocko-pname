import React from "react";
import { getUnpostedProducts } from "./actions";
import UnpostedGroupedTable from "./components/table";

export default async function Page() {
    const { groupedProducts } = await getUnpostedProducts();
    return <UnpostedGroupedTable data={groupedProducts} />;
}
