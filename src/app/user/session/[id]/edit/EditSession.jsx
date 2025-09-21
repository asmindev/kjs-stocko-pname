"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Save, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BarcodeScanner from "@/components/BarcodeScanner";

// Import components from scan module
import {
    productTableSchema,
    defaultProductTableValues,
    defaultProductItem,
} from "../../../scan/schemas/product-table.schema";
import { useProductSearch } from "../../../scan/hooks/useProductSearch";
import UomSelect from "../../../scan/components/UomSelect";
import LocationSelect from "../../../scan/components/LocationSelect";

export default function EditSession({
    sessionData,
    inventoryLocations = [],
    warehouses = [],
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scanningForRow, setScanningForRow] = useState(null);
    const [scanResultCallback, setScanResultCallback] = useState(null);

    // Transform existing products to form format
    const getInitialFormValues = () => {
        if (sessionData.products && sessionData.products.length > 0) {
            return {
                products: sessionData.products.map((product) => ({
                    barcode: product.barcode || "",
                    name: product.name || "",
                    product_id: product.product_id || null,
                    uom_id: product.uom_id ? product.uom_id.toString() : "",
                    uom_name: product.uom_name || "",
                    location_id: product.location_id || null,
                    location_name: product.location_name || "",
                    quantity: product.quantity || 1,
                })),
            };
        }
        return defaultProductTableValues;
    };

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm({
        resolver: zodResolver(productTableSchema),
        defaultValues: getInitialFormValues(),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "products",
    });

    const watchedProducts = watch("products");

    // Use the custom hook for product search
    const {
        searchingRows,
        performSearch,
        handleScanResult,
        clearProductData,
        resetSearchData,
        getProductData,
        isRowSearching,
        clearSearchCache,
        cleanup,
    } = useProductSearch(setValue);

    const prevBarcodesRef = useRef([]);
    useEffect(() => {
        const currentBarcodes = watchedProducts.map((p) => p.barcode || "");
        currentBarcodes.forEach((barcode, index) => {
            const prevBarcode = prevBarcodesRef.current[index] || "";

            if (
                barcode !== prevBarcode &&
                barcode &&
                barcode.length > 0 &&
                !isRowSearching(index)
            ) {
                if (prevBarcode) {
                    clearSearchCache(index, prevBarcode);
                }

                performSearch(barcode, index);
            }
        });

        // Update previous barcodes
        prevBarcodesRef.current = currentBarcodes;

        // Cleanup timeouts on unmount
        return cleanup;
    }, [
        watchedProducts.map((p) => p.barcode).join(","),
        // Remove other dependencies to prevent infinite loop
    ]);

    // Handle camera scan success
    const handleScanSuccess = async (barcode) => {
        if (scanningForRow !== null && scanResultCallback) {
            scanResultCallback(barcode, scanningForRow);
            setScanningForRow(null);
            setScanResultCallback(null);
        }
    };

    // Handle camera scan error
    const handleScanError = (error) => {
        console.error("Scan error:", error);
        toast.error("Gagal mengakses kamera", {
            description: "Silakan masukkan barcode secara manual",
        });
        setScanningForRow(null);
        setScanResultCallback(null);
    };

    // Handle camera scan close
    const handleScanClose = () => {
        setScanningForRow(null);
        setScanResultCallback(null);
        toast.dismiss(); // Dismiss any active toasts
    };

    // Handle scan request for specific row
    const handleScanRequest = useCallback(
        (rowIndex) => {
            setScanningForRow(rowIndex);
            setScanResultCallback(() => handleScanResult);
            toast.info(`Siap scan untuk baris ${rowIndex + 1}`, {
                description: "Arahkan kamera ke barcode",
            });
        },
        [handleScanResult]
    );

    // Add new row to the form
    const addNewRow = useCallback(() => {
        append(defaultProductItem);
    }, [append]);

    // Remove row from the form
    const removeRow = useCallback(
        (index) => {
            if (fields.length > 1) {
                remove(index);
                clearProductData(index);
            } else {
                toast.error("Minimal harus ada 1 produk");
            }
        },
        [fields.length, remove, clearProductData]
    );

    // Handle form submission
    const onSubmit = useCallback(
        async (data) => {
            try {
                setIsSubmitting(true);

                const response = await fetch(
                    `/api/session/${sessionData.id}/products`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            products: data.products.map((product) => ({
                                product_id: product.product_id,
                                barcode: product.barcode,
                                name: product.name,
                                uom_id: product.uom_id,
                                uom_name: product.uom_name,
                                location_id: product.location_id,
                                location_name: product.location_name,
                                quantity: product.quantity,
                            })),
                        }),
                    }
                );

                const result = await response.json();

                if (response.ok) {
                    const successCount = result.successCount || 0;
                    const failedCount = result.failedCount || 0;

                    toast.success(`${successCount} produk berhasil disimpan!`, {
                        description:
                            failedCount > 0
                                ? `${failedCount} produk gagal disimpan`
                                : undefined,
                    });

                    // Navigate back to session detail and refresh
                    router.push(`/user/session/${sessionData.id}`);
                    router.refresh();
                } else {
                    toast.error("Gagal menyimpan produk", {
                        description:
                            result.error || "Terjadi kesalahan pada server",
                    });
                }
            } catch (error) {
                console.error("Submit error:", error);
                toast.error("Terjadi kesalahan jaringan", {
                    description: "Periksa koneksi internet Anda",
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [sessionData.id, router]
    );

    // Handle form reset - reset to original session data
    const handleReset = useCallback(() => {
        reset(getInitialFormValues());
        resetSearchData();
    }, [reset, resetSearchData]);

    // Handle back navigation
    const handleBack = () => {
        router.push(`/user/session/${sessionData.id}`);
    };

    return (
        <div className="w-full">
            <Card className="h-full border-0 shadow-none">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <CardTitle className="text-3xl font-bold">
                                Edit Session:{" "}
                                {sessionData.name || `#${sessionData.id}`}
                            </CardTitle>
                            <CardDescription>
                                Edit produk dalam session ini - tambah, ubah,
                                atau hapus produk menggunakan kamera atau input
                                manual
                            </CardDescription>
                        </div>
                    </div>
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

                    {/* Product Form */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="w-full overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 text-center whitespace-nowrap">
                                            Scan
                                        </TableHead>
                                        <TableHead className="min-w-[180px] sm:min-w-[200px] whitespace-nowrap after:content-['*'] after:text-red-500 after:ml-1">
                                            Barcode
                                        </TableHead>
                                        <TableHead className="min-w-[200px] sm:min-w-[250px] whitespace-nowrap">
                                            Nama Produk
                                        </TableHead>
                                        <TableHead className="w-20 sm:w-24 whitespace-nowrap">
                                            UoM
                                        </TableHead>
                                        <TableHead className="min-w-[200px] sm:min-w-[250px] whitespace-nowrap after:content-['*'] after:text-red-500 after:ml-1">
                                            Lokasi Produk
                                        </TableHead>
                                        <TableHead className="w-20 sm:w-24 whitespace-nowrap">
                                            Qty{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-16 text-center whitespace-nowrap">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            {/* Scan Button */}
                                            <TableCell className="text-center p-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleScanRequest(index)
                                                    }
                                                    className="h-8 w-8 p-0 shrink-0"
                                                    title={`Scan barcode untuk baris ${
                                                        index + 1
                                                    }`}
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                            </TableCell>

                                            {/* Barcode Input */}
                                            <TableCell className="px-1">
                                                <div className="space-y-1 min-w-[160px] sm:min-w-[180px]">
                                                    {/* Hidden inputs */}
                                                    <input
                                                        type="hidden"
                                                        {...register(
                                                            `products.${index}.product_id`
                                                        )}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        {...register(
                                                            `products.${index}.uom_name`
                                                        )}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        {...register(
                                                            `products.${index}.location_id`
                                                        )}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        {...register(
                                                            `products.${index}.location_name`
                                                        )}
                                                    />
                                                    <Input
                                                        {...register(
                                                            `products.${index}.barcode`
                                                        )}
                                                        placeholder="Scan/masukkan barcode"
                                                        autoFocus={index === 0}
                                                        className={cn(
                                                            "w-full text-sm",
                                                            errors.products?.[
                                                                index
                                                            ]?.barcode &&
                                                                "border-red-500"
                                                        )}
                                                    />
                                                    {errors.products?.[index]
                                                        ?.barcode && (
                                                        <p className="text-red-500 text-xs">
                                                            {
                                                                errors.products[
                                                                    index
                                                                ].barcode
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Product Name Input */}
                                            <TableCell className="px-1">
                                                <div className="space-y-1 min-w-[180px] sm:min-w-[220px]">
                                                    <Input
                                                        disabled={true}
                                                        {...register(
                                                            `products.${index}.name`
                                                        )}
                                                        placeholder="Nama produk"
                                                        className={cn(
                                                            "w-full text-sm",
                                                            errors.products?.[
                                                                index
                                                            ]?.name &&
                                                                "border-red-500"
                                                        )}
                                                    />
                                                    {errors.products?.[index]
                                                        ?.name && (
                                                        <p className="text-red-500 text-xs">
                                                            {
                                                                errors.products[
                                                                    index
                                                                ].name.message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* UoM Select */}
                                            <TableCell className="px-1">
                                                <UomSelect
                                                    product={getProductData(
                                                        index
                                                    )}
                                                    value={
                                                        watch(
                                                            `products.${index}.uom_id`
                                                        ) || ""
                                                    }
                                                    onValueChange={(value) => {
                                                        setValue(
                                                            `products.${index}.uom_id`,
                                                            value
                                                        );
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Location Select */}
                                            <TableCell className="px-1">
                                                <div className="space-y-1 min-w-[200px] sm:min-w-[250px]">
                                                    <LocationSelect
                                                        value={watch(
                                                            `products.${index}.location_id`
                                                        )}
                                                        selectedWarehouse={
                                                            sessionData?.warehouse_id
                                                        }
                                                        inventoryLocations={
                                                            inventoryLocations
                                                        }
                                                        onValueChange={(
                                                            locationData
                                                        ) => {
                                                            setValue(
                                                                `products.${index}.location_id`,
                                                                locationData.location_id
                                                            );
                                                            setValue(
                                                                `products.${index}.location_name`,
                                                                locationData.location_name
                                                            );
                                                        }}
                                                    />
                                                    {errors.products?.[index]
                                                        ?.location_id && (
                                                        <p className="text-red-500 text-xs">
                                                            {
                                                                errors.products[
                                                                    index
                                                                ].location_id
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Quantity Input */}
                                            <TableCell className="px-1">
                                                <div className="space-y-1 min-w-[60px] sm:min-w-[80px]">
                                                    <Input
                                                        {...register(
                                                            `products.${index}.quantity`,
                                                            {
                                                                valueAsNumber: true,
                                                            }
                                                        )}
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        placeholder="1"
                                                        className={cn(
                                                            "w-full text-sm text-center",
                                                            errors.products?.[
                                                                index
                                                            ]?.quantity &&
                                                                "border-red-500"
                                                        )}
                                                    />
                                                    {errors.products?.[index]
                                                        ?.quantity && (
                                                        <p className="text-red-500 text-xs">
                                                            {
                                                                errors.products[
                                                                    index
                                                                ].quantity
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Remove Button */}
                                            <TableCell className="text-center p-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeRow(index)
                                                    }
                                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0 shrink-0"
                                                    disabled={
                                                        fields.length === 1
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Form Errors */}
                        {errors.products && (
                            <p className="text-red-500 text-sm">
                                {errors.products.message}
                            </p>
                        )}

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addNewRow}
                                className="flex items-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Baris
                            </Button>
                            <Button
                                type="submit"
                                className="flex items-center gap-2 flex-1"
                                disabled={isSubmitting}
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting
                                    ? "Menyimpan..."
                                    : `Simpan ${fields.length} Produk`}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
