import { useState, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

/**
 * LocationSelect Component
 * Enhanced component untuk memilih lokasi berdasarkan warehouse yang dipilih dengan fitur pencarian yang lebih baik
 *
 * @param {Object} props
 * @param {string|number} props.value - Current selected location ID
 * @param {Function} props.onValueChange - Callback when location changes
 * @param {string} props.selectedWarehouse - Selected warehouse stock_location_id
 * @param {Array} props.inventoryLocations - Array of all inventory locations
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.placeholder - Placeholder text for search
 * @param {boolean} props.clearable - Whether the selection can be cleared
 * @returns {JSX.Element}
 */
export default function LocationSelect({
    value = "",
    onValueChange,
    selectedWarehouse,
    inventoryLocations = [],
    disabled = false,
    placeholder = "Pilih lokasi...",
    clearable = false,
}) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // Memoized filtered locations berdasarkan warehouse
    const warehouseLocations = useMemo(() => {
        if (!selectedWarehouse || !inventoryLocations.length) {
            return [];
        }

        return inventoryLocations.filter(
            (location) =>
                location.stock_location_id?.[0] === parseInt(selectedWarehouse)
        );
    }, [selectedWarehouse, inventoryLocations]);

    // Memoized filtered locations berdasarkan pencarian
    const filteredLocations = useMemo(() => {
        if (!searchValue.trim()) {
            return warehouseLocations;
        }

        const searchTerm = searchValue.toLowerCase().trim();

        return warehouseLocations.filter((location) => {
            const displayName = location.display_name?.toLowerCase() || "";
            const locationName = location.name?.toLowerCase() || "";
            const locationCode = location.location_code?.toLowerCase() || "";

            // Search in multiple fields for better results
            return (
                displayName.includes(searchTerm) ||
                locationName.includes(searchTerm) ||
                locationCode.includes(searchTerm) ||
                // Support partial word matching
                displayName
                    .split(" ")
                    .some((word) => word.startsWith(searchTerm)) ||
                locationName
                    .split(" ")
                    .some((word) => word.startsWith(searchTerm))
            );
        });
    }, [warehouseLocations, searchValue]);

    // Get selected location for display
    const selectedLocation = useMemo(() => {
        return warehouseLocations.find((loc) => loc.id === parseInt(value));
    }, [warehouseLocations, value]);

    // Reset search when warehouse changes or component closes
    useEffect(() => {
        if (!selectedWarehouse) {
            setSearchValue("");
        }
    }, [selectedWarehouse]);

    // Handle location change
    const handleLocationChange = useCallback(
        (locationId) => {
            if (locationId === "clear") {
                onValueChange?.({
                    location_id: null,
                    location_name: "",
                });
                setOpen(false);
                return;
            }

            const selectedLoc = warehouseLocations.find(
                (loc) => loc.id === parseInt(locationId)
            );

            if (selectedLoc && onValueChange) {
                const locationData = {
                    location_id: selectedLoc.id,
                    location_name: selectedLoc.display_name,
                    location_code: selectedLoc.location_code,
                };
                onValueChange(locationData);
            }
            setOpen(false);
        },
        [warehouseLocations, onValueChange]
    );

    // Handle popover state
    const handleOpenChange = useCallback((newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSearchValue("");
        }
    }, []);

    // Render different states
    if (!selectedWarehouse) {
        return (
            <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between text-muted-foreground"
                disabled
            >
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Pilih gudang terlebih dahulu</span>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
        );
    }

    if (warehouseLocations.length === 0) {
        return (
            <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between text-muted-foreground"
                disabled
            >
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Tidak ada lokasi tersedia</span>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate text-left">
                            {selectedLocation
                                ? selectedLocation.display_name
                                : placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder="Cari lokasi..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                            className="border-0 focus:ring-0"
                        />
                    </div>

                    <CommandList>
                        {filteredLocations.length === 0 ? (
                            <CommandEmpty className="py-6 text-center text-sm">
                                {searchValue
                                    ? `Tidak ditemukan lokasi dengan kata "${searchValue}"`
                                    : "Tidak ada lokasi tersedia"}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {/* Clear option jika clearable */}
                                {clearable && selectedLocation && (
                                    <>
                                        <CommandItem
                                            value="clear"
                                            onSelect={() =>
                                                handleLocationChange("clear")
                                            }
                                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex items-center justify-center w-4 h-4">
                                                    <X className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">
                                                    Hapus pilihan
                                                </span>
                                            </div>
                                        </CommandItem>
                                        <div className="border-t my-1" />
                                    </>
                                )}

                                {/* Location options */}
                                <div className="max-h-[300px] overflow-y-auto">
                                    {filteredLocations.map((location) => {
                                        const isSelected =
                                            value === location.id.toString();
                                        return (
                                            <CommandItem
                                                key={location.id}
                                                value={location.id.toString()}
                                                onSelect={() =>
                                                    handleLocationChange(
                                                        location.id
                                                    )
                                                }
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    isSelected &&
                                                        "bg-accent/50 border-l-2 border-l-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    {/* Check icon */}
                                                    <div className="flex items-center justify-center w-4 h-4">
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4 transition-all",
                                                                isSelected
                                                                    ? "opacity-100 text-primary scale-100"
                                                                    : "opacity-0 scale-75"
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Location info */}
                                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                        <span
                                                            className={cn(
                                                                "transition-colors",
                                                                isSelected
                                                                    ? "font-semibold text-primary"
                                                                    : "font-medium"
                                                            )}
                                                        >
                                                            {
                                                                location.display_name
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* Selected badge */}
                                                    {isSelected && (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        );
                                    })}
                                </div>
                            </CommandGroup>
                        )}
                    </CommandList>

                    {/* Footer info */}
                    {filteredLocations.length > 0 && (
                        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                            {searchValue
                                ? `${filteredLocations.length} dari ${warehouseLocations.length} lokasi`
                                : `${warehouseLocations.length} lokasi tersedia`}
                        </div>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
}
