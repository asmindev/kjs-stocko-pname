"use client";
import React, { useState, useEffect } from "react";
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
import SessionForm from "./components/SessionForm";

export default function Scanner({ warehouses }) {
    const [scanningForRow, setScanningForRow] = useState(null);
    const [scanResultCallback, setScanResultCallback] = useState(null);
    const [sessionData, setSessionData] = useState({
        warehouse: "",
        warehouseName: "",
        // Field lain bisa ditambahkan di sini nantinya
        // date: "",
        // operator: "",
        // shift: "",
        // notes: "",
    });

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
        setSessionData({ warehouse: "" }); // Reset session data
        toast.success("Semua produk berhasil disimpan!");
    };

    const handleFormReset = () => {
        setScanningForRow(null);
        setScanResultCallback(null);
        setSessionData({ warehouse: "" }); // Reset session data
    };

    const handleRequestScan = (rowIndex, callback) => {
        setScanningForRow(rowIndex);
        setScanResultCallback(() => callback);
        toast.info(`Siap scan untuk baris ${rowIndex + 1}`, {
            description: "Arahkan kamera ke barcode",
        });
    };

    return (
        <div className="w-full">
            <Card className="h-full border-0 shadow-none">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">
                        Scanner Product
                    </CardTitle>
                    <CardDescription className="">
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

                    {/* Session Form */}
                    <SessionForm
                        warehouses={warehouses}
                        sessionData={sessionData}
                        onSessionChange={setSessionData}
                    />

                    {/* Table Form */}
                    <ProductTableForm
                        onSuccess={handleFormSuccess}
                        onReset={handleFormReset}
                        onRequestScan={handleRequestScan}
                        selectedWarehouse={sessionData.warehouse}
                        selectedWarehouseName={sessionData.warehouseName}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
