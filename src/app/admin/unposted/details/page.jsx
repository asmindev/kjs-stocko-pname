// app/admin/unposted/details/page.jsx
import DetailsPage from "./DetailsPage";

export default async function Page({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const warehouseId = resolvedSearchParams?.warehouseId;
    const productKey = resolvedSearchParams?.productKey;

    return <DetailsPage warehouseId={warehouseId} productKey={productKey} />;
}
