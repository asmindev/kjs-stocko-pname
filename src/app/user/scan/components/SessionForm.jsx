import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * SessionForm Component
 * Komponen untuk form session yang bisa berisi berbagai field seperti warehouse, dll
 *
 * @param {Object} props
 * @param {Array} props.warehouses - Array data warehouse
 * @param {Object} props.sessionData - Object berisi data session
 * @param {string} props.sessionData.warehouse - Selected warehouse ID
 * @param {Function} props.onSessionChange - Callback when session data changes
 * @param {boolean} props.disabled - Whether the form is disabled
 * @returns {JSX.Element}
 */
export default function SessionForm({
    warehouses = [],
    sessionData = {},
    onSessionChange,
    disabled = false,
}) {
    return (
        <div className="space-y-4">
            {/* Warehouse Selection */}
            <div>
                <label className="block text-sm font-medium mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                    Pilih Gudang
                </label>
                <Select
                    value={sessionData.warehouse || ""}
                    onValueChange={(value) => {
                        const selectedWarehouse = warehouses.find(
                            (w) => w.lot_stock_id[0].toString() === value
                        );
                        onSessionChange({
                            ...sessionData,
                            warehouse: value,
                            warehouseName: selectedWarehouse?.name || "",
                        });
                    }}
                    disabled={disabled}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Pilih Gudang" />
                    </SelectTrigger>
                    <SelectContent>
                        {warehouses.length > 0 ? (
                            warehouses.map((warehouse) => (
                                <SelectItem
                                    key={warehouse.id}
                                    value={warehouse.lot_stock_id[0].toString()}
                                >
                                    {warehouse.name}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="" disabled>
                                Tidak ada gudang tersedia
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>

                {/* Show validation message if no warehouse selected */}
                {!sessionData.warehouse && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Warehouse wajib dipilih sebelum menyimpan produk
                    </p>
                )}

                {/* Show current selection info */}
                {sessionData.warehouse && warehouses.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                        Gudang:{" "}
                        {warehouses.find(
                            (w) =>
                                w.lot_stock_id[0].toString() ===
                                sessionData.warehouse
                        )?.name || "Unknown"}
                    </p>
                )}
            </div>

            {/* Placeholder untuk field tambahan di masa depan */}
            {/*
            Field lain bisa ditambahkan di sini seperti:
            - Tanggal session
            - Operator/User
            - Shift
            - Lokasi spesifik
            - Notes/Keterangan
            - dll
            */}
        </div>
    );
}
