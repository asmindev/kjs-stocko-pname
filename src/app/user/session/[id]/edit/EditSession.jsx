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

    // Get product data for UoM select, combining search results with session data
    const getProductDataForUom = (index) => {
        const searchData = getProductData(index);
        const sessionProduct = watchedProducts[index];

        // If we have search data, use it
        if (searchData && (searchData.uom_id || searchData.uom_po_id)) {
            return searchData;
        }

        // Otherwise, create UoM data from session product
        if (
            sessionProduct &&
            sessionProduct.uom_id &&
            sessionProduct.uom_name
        ) {
            return {
                uom_id: sessionProduct.uom_id,
                uom_name: sessionProduct.uom_name,
            };
        }

        return null;
    };
    useEffect(() => {
        if (sessionData.products && sessionData.products.length > 0) {
            const existingBarcodes = sessionData.products
                .map((p, idx) => [idx, p.barcode])
                .filter(([_, barcode]) => barcode);

            // Initialize Map with row index -> barcode mapping
            searchedBarcodesRef.current = new Map(existingBarcodes);
        }
    }, [sessionData.products]);

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
    const searchedBarcodesRef = useRef(new Map()); // Track barcodes per row: Map<rowIndex, barcode>

    useEffect(() => {
        const currentBarcodes = watchedProducts.map((p) => p.barcode || "");

        // Only search for barcodes that are new or changed
        currentBarcodes.forEach((barcode, index) => {
            const prevBarcode = prevBarcodesRef.current[index] || "";
            const currentProduct = watchedProducts[index];

            // Only perform search if:
            // 1. Barcode is different from previous
            // 2. Barcode is not empty
            // 3. Not currently searching for this row
            if (
                barcode !== prevBarcode &&
                barcode &&
                barcode.length > 0 &&
                !isRowSearching(index)
            ) {
                // If barcode changed and the row already has product data, clear it
                if (prevBarcode && currentProduct?.name) {
                    // Clear all product-related fields when barcode changes
                    setValue(`products.${index}.product_id`, "");
                    setValue(`products.${index}.name`, "");
                    setValue(`products.${index}.uom_id`, "");
                    setValue(`products.${index}.uom_name`, "");
                    // Note: We keep location_id and location_name as they are reusable

                    clearSearchCache(index, prevBarcode);
                }

                // Always perform search when barcode changes
                performSearch(barcode, index);
                // Update the Map with the new barcode for this row
                searchedBarcodesRef.current.set(index, barcode);
            }
        });

        // Update previous barcodes
        prevBarcodesRef.current = currentBarcodes;

        // Cleanup timeouts on unmount
        return cleanup;
    }, [watchedProducts.map((p) => p.barcode).join(",")]);

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

    /**
     * Check if the last row is filled completely
     */
    const isLastRowComplete = useCallback(() => {
        if (fields.length === 0) return true;

        const lastRowIndex = fields.length - 1;
        const lastRow = watchedProducts[lastRowIndex];

        // Check if all required fields are filled
        return (
            lastRow?.barcode?.trim() &&
            lastRow?.name?.trim() &&
            lastRow?.location_id &&
            lastRow?.quantity > 0
        );
    }, [fields.length, watchedProducts]);

    // Add new row to the form
    // Automatically copies some values from the previous row
    const addNewRow = useCallback(() => {
        // Validate that the last row is complete before adding new row
        if (!isLastRowComplete()) {
            toast.error("Lengkapi data produk sebelumnya terlebih dahulu");
            return;
        }

        // Get the last row's data directly from form watch
        const lastRowIndex = fields.length - 1;

        // Use watch to get the most up-to-date values
        const lastLocationId = watch(`products.${lastRowIndex}.location_id`);
        const lastLocationName = watch(
            `products.${lastRowIndex}.location_name`
        );

        // Create new row with copied values from the last row
        const newRow = {
            ...defaultProductItem,
            // Copy location data if exists (most commonly reused)
            ...(lastLocationId &&
                lastLocationName && {
                    location_id: lastLocationId,
                    location_name: lastLocationName,
                }),
            // Optionally copy UoM data if you want
            // ...(lastRowData?.uom_id && {
            //     uom_id: lastRowData.uom_id,
            //     uom_name: lastRowData.uom_name,
            // }),
            // Note: We don't copy barcode, name, product_id, or quantity
            // as these should be unique for each product
        };

        append(newRow);
        // Note: New rows will have empty barcode, so they won't trigger search until barcode is entered
    }, [append, fields.length, watch, isLastRowComplete]);

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
                console.log({ data });

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
                    // router.push(`/user/session/${sessionData.id}`);
                    router.refresh();
                } else {
                    toast.error("Gagal menyimpan produk", {
                        description:
                            result.error || "Terjadi kesalahan pada server",
                    });
                }
            } catch (error) {
                toast.error("Terjadi kesalahan jaringan", {
                    description: "Periksa koneksi internet Anda",
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [sessionData.id, router]
    );

    // Handle back navigation
    const handleBack = () => {
        router.push(`/user/session/${sessionData.id}`);
    };

    return (
        <div className="w-full">
            <Card className="h-full border-0 shadow-none">
                <CardHeader className={"p-0"}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className={"w-fit"}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <div className="flex-1">
                            <CardTitle className="textxl md:text-3xl font-bold">
                                Edit Dokumen:{" "}
                                {sessionData.name || `#${sessionData.id}`}
                            </CardTitle>
                            <CardDescription>
                                Edit produk dalam dokumen ini - tambah, ubah,
                                atau hapus produk menggunakan kamera atau input
                                manual
                            </CardDescription>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-row gap-2 mt-4">
                        <Button
                            type="submit"
                            form="edit-session-form"
                            className="flex items-center gap-2 flex-1"
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting
                                ? "Menyimpan..."
                                : `Simpan ${fields.length} Produk`}
                        </Button>
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
                        id="edit-session-form"
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
                                                    product={getProductDataForUom(
                                                        index
                                                    )}
                                                    value={
                                                        watch(
                                                            `products.${index}.uom_id`
                                                        ) || ""
                                                    }
                                                    onValueChange={(
                                                        value,
                                                        uomName
                                                    ) => {
                                                        setValue(
                                                            `products.${index}.uom_id`,
                                                            value
                                                        );
                                                        if (uomName) {
                                                            setValue(
                                                                `products.${index}.uom_name`,
                                                                uomName
                                                            );
                                                        }
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
                                                        step="0.01"
                                                        placeholder="1.00"
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

                        {/* Add Row Button */}
                        <div className="flex justify-start">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addNewRow}
                                disabled={!isLastRowComplete()}
                                className="flex items-center gap-2"
                                title={
                                    !isLastRowComplete()
                                        ? "Lengkapi data produk sebelumnya terlebih dahulu"
                                        : "Tambah baris produk baru"
                                }
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Baris
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
