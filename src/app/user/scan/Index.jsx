"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductTableForm from "./components/ProductTableForm";
import SessionForm from "./components/SessionForm";

export default function Scanner({ warehouses, inventoryLocations = [] }) {
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

    // Ref untuk mengakses ProductTableForm
    const productFormRef = useRef(null);
    const [formState, setFormState] = useState({
        isSubmitting: false,
        fieldsLength: 0,
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

    const handleScanClose = () => {
        setScanningForRow(null);
        setScanResultCallback(null);
        toast.dismiss(); // Dismiss any active toasts
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

    // Handler untuk submit form dari button eksternal
    const handleSubmitForm = () => {
        if (productFormRef.current) {
            productFormRef.current.submit();
        }
    };

    // Handler untuk reset form dari button eksternal
    const handleResetForm = () => {
        if (productFormRef.current) {
            productFormRef.current.reset();
        }
    };

    // Handler untuk menerima perubahan state form
    const handleFormStateChange = useCallback((newState) => {
        setFormState(newState);
    }, []);

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
                                onClose={handleScanClose}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 items-center">
                        {/* Session Form */}
                        <SessionForm
                            warehouses={warehouses}
                            sessionData={sessionData}
                            onSessionChange={setSessionData}
                        />
                        <div>
                            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                <Button
                                    type="button"
                                    className="flex items-center gap-2 flex-1"
                                    disabled={formState.isSubmitting}
                                    onClick={handleSubmitForm}
                                >
                                    <Save className="h-4 w-4" />
                                    {formState.isSubmitting
                                        ? "Menyimpan..."
                                        : `Simpan ${formState.fieldsLength} Produk`}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleResetForm}
                                    disabled={formState.isSubmitting}
                                    className="w-full sm:w-auto"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Form */}
                    <ProductTableForm
                        ref={productFormRef}
                        onSuccess={handleFormSuccess}
                        onReset={handleFormReset}
                        onRequestScan={handleRequestScan}
                        onFormStateChange={handleFormStateChange}
                        selectedWarehouse={sessionData.warehouse}
                        selectedWarehouseName={sessionData.warehouseName}
                        inventoryLocations={inventoryLocations}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
