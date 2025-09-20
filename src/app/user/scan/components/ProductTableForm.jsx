"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Trash2, Plus, Save, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import refactored modules
import {
    productTableSchema,
    defaultProductTableValues,
    defaultProductItem,
} from "../schemas/product-table.schema";
import { useProductSearch } from "../hooks/useProductSearch";
import { submitProducts } from "../services/product.service";
import UomSelect from "./UomSelect";

/**
 * ProductTableForm Component
 *
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback when products are successfully submitted
 * @param {Function} props.onReset - Callback when form is reset
 * @param {Function} props.onRequestScan - Callback to request scan for specific row
 * @param {string} props.selectedWarehouse - Selected warehouse ID
 * @param {string} props.selectedWarehouseName - Selected warehouse name
 */
export default function ProductTableForm({
    onSuccess,
    onReset,
    onRequestScan,
    selectedWarehouse,
    selectedWarehouseName,
}) {
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset,
    } = useForm({
        resolver: zodResolver(productTableSchema),
        defaultValues: defaultProductTableValues,
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

    // Previous barcode values to detect changes
    const prevBarcodesRef = useRef([]);

    // Auto-search products when barcode changes
    useEffect(() => {
        const currentBarcodes = watchedProducts.map((p) => p.barcode || "");
        currentBarcodes.forEach((barcode, index) => {
            const prevBarcode = prevBarcodesRef.current[index] || "";

            // Only search if barcode changed and is not empty
            if (
                barcode !== prevBarcode &&
                barcode &&
                barcode.length > 0 &&
                !isRowSearching(index)
            ) {
                console.log(
                    `Barcode changed at row ${index}: "${prevBarcode}" -> "${barcode}"`
                );

                // Clear cache for old barcode if it existed
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

    /**
     * Handle scan request for specific row
     */
    const handleScanRequest = useCallback(
        (rowIndex) => {
            if (onRequestScan) {
                onRequestScan(rowIndex, handleScanResult);
            }
        },
        [onRequestScan, handleScanResult]
    );

    /**
     * Add new row to the form
     */
    const addNewRow = useCallback(() => {
        append(defaultProductItem);
    }, [append]);

    /**
     * Remove row from the form
     */
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

    /**
     * Handle form submission
     */
    const onSubmit = useCallback(
        async (data) => {
            try {
                // Validate warehouse selection
                console.log("data.products:", data.products);
                if (!selectedWarehouse) {
                    toast.error("Pilih gudang terlebih dahulu");
                    return;
                }

                console.log("Form submission data:", data);
                console.log("Products being submitted:", data.products);

                const result = await submitProducts(
                    data.products,
                    selectedWarehouse,
                    selectedWarehouseName
                );

                if (result.success) {
                    console.log("Products submitted successfully:", result);
                    // Reset form and search data
                    reset(defaultProductTableValues);
                    resetSearchData();
                    onSuccess?.(result);
                }
            } catch (error) {
                console.error("Submit error:", error);
            }
        },
        [reset, resetSearchData, onSuccess, selectedWarehouse]
    );

    /**
     * Handle form reset
     */
    const handleReset = useCallback(() => {
        reset(defaultProductTableValues);
        resetSearchData();
        onReset?.();
    }, [reset, resetSearchData, onReset]);

    return (
        <div className="space-y-4 w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center whitespace-nowrap">
                                    Scan
                                </TableHead>
                                <TableHead className="min-w-[180px] sm:min-w-[200px] whitespace-nowrap">
                                    Barcode{" "}
                                    <span className="text-red-500">*</span>
                                </TableHead>
                                <TableHead className="min-w-[200px] sm:min-w-[250px] whitespace-nowrap">
                                    Nama Produk
                                </TableHead>
                                <TableHead className="w-20 sm:w-24 whitespace-nowrap">
                                    UoM
                                </TableHead>
                                <TableHead className="w-20 sm:w-24 whitespace-nowrap">
                                    Qty <span className="text-red-500">*</span>
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
                                            {/* Hidden input for Product ID from Odoo */}
                                            <input
                                                type="hidden"
                                                {...register(
                                                    `products.${index}.product_id`
                                                )}
                                            />
                                            {/* Hidden input for UoM Name */}
                                            <input
                                                type="hidden"
                                                {...register(
                                                    `products.${index}.uom_name`
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
                                                    errors.products?.[index]
                                                        ?.barcode &&
                                                        "border-red-500"
                                                )}
                                            />
                                            {errors.products?.[index]
                                                ?.barcode && (
                                                <p className="text-red-500 text-xs">
                                                    {
                                                        errors.products[index]
                                                            .barcode.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Product Name Input */}
                                    <TableCell className="px-1">
                                        <div className="space-y-1 min-w-[180px] sm:min-w-[220px]">
                                            <Input
                                                {...register(
                                                    `products.${index}.name`
                                                )}
                                                placeholder="Nama produk"
                                                className={cn(
                                                    "w-full text-sm",
                                                    errors.products?.[index]
                                                        ?.name &&
                                                        "border-red-500"
                                                )}
                                            />
                                            {errors.products?.[index]?.name && (
                                                <p className="text-red-500 text-xs">
                                                    {
                                                        errors.products[index]
                                                            .name.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* UoM Select */}
                                    <TableCell className="px-1">
                                        <UomSelect
                                            product={getProductData(index)}
                                            value={
                                                watch(
                                                    `products.${index}.uom_id`
                                                ) || ""
                                            }
                                            onValueChange={(value) => {
                                                console.log(
                                                    "UoM value changed for row",
                                                    index,
                                                    "to:",
                                                    value
                                                );
                                                setValue(
                                                    `products.${index}.uom_id`,
                                                    value
                                                );
                                            }}
                                        />
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
                                                    errors.products?.[index]
                                                        ?.quantity &&
                                                        "border-red-500"
                                                )}
                                            />
                                            {errors.products?.[index]
                                                ?.quantity && (
                                                <p className="text-red-500 text-xs">
                                                    {
                                                        errors.products[index]
                                                            .quantity.message
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
                                            onClick={() => removeRow(index)}
                                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0 shrink-0"
                                            disabled={fields.length === 1}
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
                        type="button"
                        variant="outline"
                        onClick={() => {
                            console.log("Current form values:", watch());
                            console.log(
                                "Current product search data:",
                                getProductData
                            );
                        }}
                        className="w-full sm:w-auto"
                    >
                        Debug Values
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
                        variant="outline"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        Reset
                    </Button>
                </div>
            </form>
        </div>
    );
}
