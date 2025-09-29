// app/admin/unposted/details/page.jsx
import DetailsPage from "./DetailsPage";

export default function Page({ searchParams }) {
    const warehouseId = searchParams?.warehouseId;
    const productKey = searchParams?.productKey;

    return <DetailsPage warehouseId={warehouseId} productKey={productKey} />;
}
