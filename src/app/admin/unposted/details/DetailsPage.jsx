"use client";
import { useEffect, useState } from "react";
import { getProductDetails } from "../actions";
import UnpostedDetails from "../components/details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DetailsPage({ warehouseId, productKey }) {
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!warehouseId || !productKey) {
                setError("Parameter tidak lengkap");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getProductDetails(warehouseId, productKey);
                setProductData(data || null);
                if (!data) setError("Data tidak ditemukan");
            } catch {
                setError("Gagal mengambil data produk");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [warehouseId, productKey]);

    if (loading) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Detail Produk</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Detail Produk</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-500 py-8">{error}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <UnpostedDetails
            productData={productData}
            warehouseName={productData?.warehouse}
        />
    );
}
