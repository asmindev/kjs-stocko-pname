"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductTableForm from "./components/ProductTableForm";

export default function Page() {
    const { data: session } = useSession();
    const [scanningForRow, setScanningForRow] = useState(null);
    const [scanResultCallback, setScanResultCallback] = useState(null);

    const handleScanSuccess = async (barcode) => {
        if (scanningForRow !== null && scanResultCallback) {
            scanResultCallback(barcode, scanningForRow);
            setScanningForRow(null);
            setScanResultCallback(null);
        }
    };

    const handleScanError = (error) => {
        console.error("Scan error:", error);
        toast.error("Gagal mengakses kamera", {
            description: "Silakan masukkan barcode secara manual",
        });
        setScanningForRow(null);
        setScanResultCallback(null);
    };

    const handleFormSuccess = () => {
        setScanningForRow(null);
        setScanResultCallback(null);
        toast.success("Semua produk berhasil disimpan!");
    };

    const handleFormReset = () => {
        setScanningForRow(null);
        setScanResultCallback(null);
    };

    const handleRequestScan = (rowIndex, callback) => {
        setScanningForRow(rowIndex);
        setScanResultCallback(() => callback);
        toast.info(`Siap scan untuk baris ${rowIndex + 1}`, {
            description: "Arahkan kamera ke barcode",
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card className="h-full border-0 shadow-none">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-bold">
                        Scanner Product
                    </CardTitle>
                    <CardDescription className="text-center">
                        Scan barcode menggunakan kamera atau masukkan secara
                        manual
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {/* Scanner Area */}
                    {scanningForRow !== null && (
                        <div className="text-center space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-800">
                                    Scan untuk Baris {scanningForRow + 1}
                                </h3>
                                <p className="text-blue-600">
                                    Arahkan kamera ke barcode yang ingin discan
                                </p>
                            </div>
                            <BarcodeScanner
                                onScan={handleScanSuccess}
                                onError={handleScanError}
                            />
                        </div>
                    )}

                    {/* Table Form */}
                    <ProductTableForm
                        onSuccess={handleFormSuccess}
                        onReset={handleFormReset}
                        onRequestScan={handleRequestScan}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
