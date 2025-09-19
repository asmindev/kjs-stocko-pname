import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import UomSelect from "./UomSelect";

/**
 * Component untuk table row produk
 * @param {Object} props
 * @param {Object} props.field - Field dari useFieldArray
 * @param {number} props.index - Index row
 * @param {Function} props.register - React Hook Form register
 * @param {Object} props.errors - Form errors
 * @param {Function} props.handleScanRequest - Handler untuk scan request
 * @param {Function} props.removeRow - Handler untuk remove row
 * @param {boolean} props.canRemove - Apakah bisa remove row
 * @param {Object} props.productData - Data produk
 * @param {Function} props.watch - React Hook Form watch
 * @param {Function} props.setValue - React Hook Form setValue
 * @param {Function} props.triggerImmediateSearch - Function untuk trigger search langsung
 * @returns {JSX.Element}
 */
export default function ProductTableRow({
    field,
    index,
    register,
    errors,
    handleScanRequest,
    removeRow,
    canRemove,
    productData,
    watch,
    setValue,
    triggerImmediateSearch,
}) {
    const product = productData[index];

    return (
        <TableRow key={field.id}>
            {/* Scan Button */}
            <TableCell className="text-center p-0">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleScanRequest(index)}
                    className="h-8 w-8 p-0 shrink-0"
                    title={`Scan barcode untuk baris ${index + 1}`}
                >
                    <QrCode className="h-4 w-4" />
                </Button>
            </TableCell>

            {/* Barcode Input */}
            <TableCell className="px-1">
                <div className="space-y-1 min-w-[160px] sm:min-w-[180px]">
                    <Input
                        {...register(`products.${index}.barcode`)}
                        placeholder="Scan/masukkan barcode"
                        autoFocus={index === 0}
                        className={cn(
                            "w-full text-sm",
                            errors.products?.[index]?.barcode
                                ? "border-red-500"
                                : ""
                        )}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const barcode = e.target.value.trim();
                                if (barcode && triggerImmediateSearch) {
                                    // Update the form value first
                                    setValue(
                                        `products.${index}.barcode`,
                                        barcode
                                    );
                                    // Then trigger immediate search
                                    triggerImmediateSearch(barcode, index);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const barcode = e.target.value.trim();
                            if (barcode && triggerImmediateSearch) {
                                // Update value on blur and trigger search
                                setValue(`products.${index}.barcode`, barcode);
                                triggerImmediateSearch(barcode, index);
                            }
                        }}
                    />
                    {errors.products?.[index]?.barcode && (
                        <p className="text-red-500 text-xs">
                            {errors.products[index].barcode.message}
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Product Name Input */}
            <TableCell className="px-1">
                <div className="space-y-1 min-w-[180px] sm:min-w-[220px]">
                    <Input
                        {...register(`products.${index}.name`)}
                        placeholder="Nama produk"
                        className={cn(
                            "w-full text-sm",
                            errors.products?.[index]?.name
                                ? "border-red-500"
                                : ""
                        )}
                    />
                    {errors.products?.[index]?.name && (
                        <p className="text-red-500 text-xs">
                            {errors.products[index].name.message}
                        </p>
                    )}
                </div>
            </TableCell>

            {/* UoM Select */}
            <TableCell className="px-1">
                <UomSelect
                    product={product}
                    value={watch(`products.${index}.uom_id`)}
                    onValueChange={(value) => {
                        setValue(`products.${index}.uom_id`, value);
                    }}
                />
            </TableCell>

            {/* Quantity Input */}
            <TableCell className="px-1">
                <div className="space-y-1 min-w-[60px] sm:min-w-[80px]">
                    <Input
                        {...register(`products.${index}.quantity`, {
                            valueAsNumber: true,
                        })}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        className={cn(
                            "w-full text-sm text-center",
                            errors.products?.[index]?.quantity
                                ? "border-red-500"
                                : ""
                        )}
                    />
                    {errors.products?.[index]?.quantity && (
                        <p className="text-red-500 text-xs">
                            {errors.products[index].quantity.message}
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
                    disabled={!canRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}
