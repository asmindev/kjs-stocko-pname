import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Multi-select location selector component
 */
export function LocationSelector({
    locations,
    selectedIds,
    onSelectionChange,
    open,
    onOpenChange,
}) {
    const toggleSelection = (locationId) => {
        if (selectedIds.includes(locationId)) {
            onSelectionChange(selectedIds.filter((id) => id !== locationId));
        } else {
            onSelectionChange([...selectedIds, locationId]);
        }
    };

    return (
        <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">Lokasi (Multi-select)</Label>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-9 justify-between text-xs"
                    >
                        <span className="truncate">
                            {selectedIds.length === 0
                                ? "Pilih Lokasi"
                                : `${selectedIds.length} lokasi dipilih`}
                        </span>
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                    <Command>
                        <CommandInput placeholder="Cari lokasi..." />
                        <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {locations.map((loc) => {
                                    const isSelected = selectedIds.includes(
                                        loc.id
                                    );
                                    return (
                                        <CommandItem
                                            key={loc.id}
                                            value={loc.display_name}
                                            onSelect={() =>
                                                toggleSelection(loc.id)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3 w-3",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <span className="text-xs">
                                                {loc.display_name}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
