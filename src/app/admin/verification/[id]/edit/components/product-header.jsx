import { Badge } from "@/components/ui/badge";

/**
 * Product header component - displays product name, barcode, and location
 */
export function ProductHeader({ productName, barcode, locationName }) {
    return (
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
            <h2 className="text-lg font-semibold">{productName}</h2>
            <Badge variant="outline" className="font-mono text-xs">
                {barcode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
                {locationName}
            </Badge>
        </div>
    );
}
