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
     * Supports both API format and session data format:
     * API format: "uom_id": [25, "Set"], "uom_po_id": [25, "Set"]
     * Session format: "uom_id": 25, "uom_name": "Set"
     */
    const getUomOptions = () => {
        if (!product) {
            return [];
        }

        // Check if product has API format (arrays)
        if (
            product.uom_id &&
            Array.isArray(product.uom_id) &&
            product.uom_po_id &&
            Array.isArray(product.uom_po_id)
        ) {
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
        }

        // Check if product has session format (direct values)
        if (product.uom_id && product.uom_name) {
            return [{ id: product.uom_id, name: product.uom_name }];
        }

        return [];
    };

    /**
     * Check if UoM select should be disabled
     * Disabled when:
     * 1. No product data available
     * 2. uom_id and uom_po_id are the same (single option) - for API format
     * 3. Only one UoM option available - for session format
     * 4. Explicitly disabled via props
     */
    const isDisabled = () => {
        if (disabled) return true;
        if (!product) return true;

        const uomOptions = getUomOptions();

        // Disable if only one UoM option available
        return uomOptions.length <= 1;
    };

    /**
     * Get default UoM value
     * For API format: use uom_id[0]
     * For session format: use uom_id directly
     */
    const getDefaultValue = () => {
        if (!product) {
            return "";
        }

        // API format
        if (product.uom_id && Array.isArray(product.uom_id)) {
            return product.uom_id[0].toString();
        }

        // Session format
        if (product.uom_id) {
            return product.uom_id.toString();
        }

        return "";
    };

    const uomOptions = getUomOptions();
    const selectDisabled = isDisabled();

    // If product is available and no value is set, use default
    const currentValue = value || (product ? getDefaultValue() : "");

    // Auto-set default UoM when product is found and no value is set
    useEffect(() => {
        if (product && !value && onValueChange) {
            const defaultValue = getDefaultValue();
            const defaultUom = uomOptions.find(
                (uom) => uom.id.toString() === defaultValue
            );
            const uomName = defaultUom ? defaultUom.name : "";
            if (defaultValue) {
                onValueChange(defaultValue, uomName);
            }
        }
    }, [product, value, onValueChange, uomOptions]);

    // Handle value change with UoM name
    const handleValueChange = (selectedValue) => {
        const selectedUom = uomOptions.find(
            (uom) => uom.id.toString() === selectedValue
        );
        const uomName = selectedUom ? selectedUom.name : "";
        onValueChange(selectedValue, uomName);
    };

    return (
        <div className="space-y-1 min-w-[80px] sm:min-w-[100px]">
            <Select
                value={currentValue}
                onValueChange={handleValueChange}
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
