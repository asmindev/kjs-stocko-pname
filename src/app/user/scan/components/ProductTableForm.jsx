"use client";
import React, {
    useEffect,
    useCallback,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
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
import LocationSelect from "./LocationSelect";

/**
 * ProductTableForm Component
 *
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback when products are successfully submitted
 * @param {Function} props.onReset - Callback when form is reset
 * @param {Function} props.onRequestScan - Callback to request scan for specific row
 * @param {string} props.selectedWarehouse - Selected warehouse ID
 * @param {string} props.selectedWarehouseName - Selected warehouse name
 * @param {Array} props.inventoryLocations - Array of inventory locations
 */
const ProductTableForm = forwardRef(function ProductTableForm(
    {
        onSuccess,
        onReset,
        onRequestScan,
        selectedWarehouse,
        selectedWarehouseName,
        inventoryLocations = [],
        onFormStateChange,
    },
    ref
) {
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

    const prevBarcodesRef = useRef([]);
    useEffect(() => {
        const currentBarcodes = watchedProducts.map((p) => p.barcode || "");
        currentBarcodes.forEach((barcode, index) => {
            const prevBarcode = prevBarcodesRef.current[index] || "";
            const currentProduct = watchedProducts[index];

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
                    setValue(`products.${index}.quantity`, ""); // Reset to default if needed

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

    /**
     * Add new row to the form
     * Automatically copies some values from the previous row
     */
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
    }, [append, fields.length, watch, isLastRowComplete]);

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
                if (!selectedWarehouse) {
                    toast.error("Pilih Lokasi terlebih dahulu");
                    return;
                }

                const result = await submitProducts(
                    data.products,
                    selectedWarehouse,
                    selectedWarehouseName
                );

                if (result.success) {
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

    // Expose form functions to parent component
    useImperativeHandle(
        ref,
        () => ({
            submit: handleSubmit(onSubmit),
            reset: handleReset,
            isSubmitting,
            fieldsLength: fields.length,
        }),
        [handleSubmit, onSubmit, handleReset, isSubmitting, fields.length]
    );

    // Notify parent of form state changes
    useEffect(() => {
        onFormStateChange?.({
            isSubmitting,
            fieldsLength: fields.length,
        });
    }, [isSubmitting, fields.length, onFormStateChange]);

    return (
        <div className="space-y-4 w-full">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full space-y-4"
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
                                <TableHead className="min-w-[400px] sm:min-w-[250px] whitespace-nowrap">
                                    Nama Produk
                                </TableHead>
                                <TableHead className="w-20 sm:w-24 whitespace-nowrap">
                                    UoM
                                </TableHead>
                                <TableHead className="min-w-[200px] sm:min-w-[250px] max-w-fit whitespace-nowrap after:content-['*'] after:text-red-500 after:ml-1">
                                    Lokasi Produk
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
                                            {/* Hidden input for Location ID */}
                                            <input
                                                type="hidden"
                                                {...register(
                                                    `products.${index}.location_id`
                                                )}
                                            />
                                            {/* Hidden input for Location Name */}
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
                                                disabled={true}
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
                                            onValueChange={(value, uomName) => {
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
                                        <div className="space-y-1 min-w-[200px] sm:min-w-[250px] max-w-fit">
                                            <LocationSelect
                                                value={watch(
                                                    `products.${index}.location_id`
                                                )}
                                                selectedWarehouse={
                                                    selectedWarehouse
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
                                                        errors.products[index]
                                                            .location_id.message
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
                        disabled={!isLastRowComplete()}
                        className="flex items-center gap-2 w-full sm:w-auto"
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
        </div>
    );
});

export default ProductTableForm;
