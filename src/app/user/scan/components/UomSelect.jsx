import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

/**
 * UomSelect Component
 * Komponen untuk memilih Unit of Measure (UoM) berdasarkan data produk
 *
 * @param {Object} props
 * @param {Object} props.product - Data produk dari API scan
 * @param {string} props.value - Current selected UoM value
 * @param {Function} props.onValueChange - Callback when UoM value changes
 * @param {boolean} props.disabled - Whether the select is disabled
 * @returns {JSX.Element}
 */
export default function UomSelect({
    product,
    value,
    onValueChange,
    disabled = false,
}) {
    /**
     * Get available UoM options from product data
     * Based on API response format:
     * "uom_id": [25, "Set"]
     * "uom_po_id": [25, "Set"]
     */
    const getUomOptions = () => {
        if (!product || !product.uom_id || !product.uom_po_id) {
            return [];
        }

        const uomId = product.uom_id[0];
        const uomName = product.uom_id[1];
        const uomPoId = product.uom_po_id[0];
        const uomPoName = product.uom_po_id[1];

        // If uom_id and uom_po_id are the same, return single option
        if (uomId === uomPoId) {
            return [{ id: uomId, name: uomName }];
        } else {
            // If different, return both options
            return [
                { id: uomId, name: uomName },
                { id: uomPoId, name: uomPoName },
            ];
        }
    };

    /**
     * Check if UoM select should be disabled
     * Disabled when:
     * 1. No product data available
     * 2. uom_id and uom_po_id are the same (single option)
     * 3. Explicitly disabled via props
     */
    const isDisabled = () => {
        if (disabled) return true;
        if (!product || !product.uom_id || !product.uom_po_id) {
            return true;
        }

        const uomId = product.uom_id[0];
        const uomPoId = product.uom_po_id[0];

        // Disable if only one UoM option available
        return uomId === uomPoId;
    };

    /**
     * Get default UoM value
     * Always use uom_id as default
     */
    const getDefaultValue = () => {
        if (!product || !product.uom_id) {
            return "";
        }
        return product.uom_id[0].toString();
    };

    const uomOptions = getUomOptions();
    const selectDisabled = isDisabled();

    // If product is available and no value is set, use default
    const currentValue = value || (product ? getDefaultValue() : "");

    // Auto-set default UoM when product is found and no value is set
    useEffect(() => {
        if (product && !value && onValueChange) {
            const defaultValue = getDefaultValue();
            if (defaultValue) {
                onValueChange(defaultValue);
            }
        }
    }, [product, value, onValueChange]);

    return (
        <div className="space-y-1 min-w-[80px] sm:min-w-[100px]">
            <Select
                value={currentValue}
                onValueChange={onValueChange}
                disabled={selectDisabled}
            >
                <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="UoM" />
                </SelectTrigger>
                <SelectContent>
                    {uomOptions.map((uom) => (
                        <SelectItem key={uom.id} value={uom.id.toString()}>
                            {uom.name + " (" + uom.id + ")"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
