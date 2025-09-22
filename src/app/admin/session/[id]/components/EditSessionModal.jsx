"use client";

import React, { useState, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

// Import components from scan module
import {
    productTableSchema,
    defaultProductTableValues,
    defaultProductItem,
} from "../../../scan/schemas/product-table.schema";
import { useProductSearch } from "../../../scan/hooks/useProductSearch";
import UomSelect from "../../../scan/components/UomSelect";
import LocationSelect from "../../../scan/components/LocationSelect";

export default function EditSessionModal({
    isOpen,
    onClose,
    sessionData,
    inventoryLocations = [],
    onSuccess,
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Handle barcode changes for product search
    useEffect(() => {
        const currentBarcodes = watchedProducts.map((p) => p.barcode || "");
        currentBarcodes.forEach((barcode, index) => {
            if (barcode && barcode.length > 0 && !isRowSearching(index)) {
                performSearch(barcode, index);
            }
        });

        return cleanup;
    }, [watchedProducts.map((p) => p.barcode).join(",")]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset(defaultProductTableValues);
            resetSearchData();
        }
    }, [isOpen, reset, resetSearchData]);

    const addNewRow = () => {
        append(defaultProductItem);
    };

    const removeRow = (index) => {
        if (fields.length > 1) {
            remove(index);
            clearProductData(index);
        } else {
            toast.error("Minimal harus ada 1 produk");
        }
    };

    const onSubmit = async (data) => {
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

                toast.success(`${successCount} produk berhasil ditambahkan!`, {
                    description:
                        failedCount > 0
                            ? `${failedCount} produk gagal ditambahkan`
                            : undefined,
                });

                // Reset form and close modal
                reset(defaultProductTableValues);
                resetSearchData();
                onClose();
                onSuccess?.();
            } else {
                toast.error("Gagal menambahkan produk", {
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
    };

    const handleReset = () => {
        reset(defaultProductTableValues);
        resetSearchData();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Produk ke Session</DialogTitle>
                    <DialogDescription>
                        Tambahkan produk baru ke session "
                        {sessionData?.name || `#${sessionData?.id}`}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                        <span className="text-red-500">*</span>
                                    </TableHead>
                                    <TableHead className="w-16 text-center whitespace-nowrap">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
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
                                                        errors.products?.[index]
                                                            ?.barcode &&
                                                            "border-red-500"
                                                    )}
                                                />
                                                {errors.products?.[index]
                                                    ?.barcode && (
                                                    <p className="text-red-500 text-xs">
                                                        {
                                                            errors.products[
                                                                index
                                                            ].barcode.message
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
                                                product={getProductData(index)}
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
                                                        errors.products?.[index]
                                                            ?.quantity &&
                                                            "border-red-500"
                                                    )}
                                                />
                                                {errors.products?.[index]
                                                    ?.quantity && (
                                                    <p className="text-red-500 text-xs">
                                                        {
                                                            errors.products[
                                                                index
                                                            ].quantity.message
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
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Batal
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
