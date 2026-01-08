"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { useRouter, useSearchParams } from "next/navigation";

export function InventoryCombobox({ inventories = [] }) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentInventoryId = searchParams.get("inventory_id");

    // Find label for current ID
    const selectedInventory = inventories.find(
        (inventory) =>
            inventory.id.toString() === currentInventoryId?.toString()
    );

    const onSelect = (currentValue) => {
        const params = new URLSearchParams(searchParams);

        // If selecting the same value, simple close (or maybe deselect logic if needed?)
        // Let's implement: if click existing => do nothing or just close.
        // But user might want to clear filter. Let's add a "Clear" option or allow deselect.
        // For now: Selection changes filter.

        if (currentValue === currentInventoryId) {
            // Do nothing for now
            setOpen(false);
            return;
        }

        params.set("inventory_id", currentValue);
        params.set("page", "1"); // Reset page
        router.push(`${window.location.pathname}?${params.toString()}`);
        setOpen(false);
    };

    const clearFilter = (e) => {
        e.stopPropagation();
        const params = new URLSearchParams(searchParams);
        params.delete("inventory_id");
        params.set("page", "1");
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[250px] justify-between"
                    >
                        {selectedInventory
                            ? selectedInventory.name
                            : "Filter by Inventory..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                    <Command>
                        <CommandInput placeholder="Search inventory..." />
                        <CommandList>
                            <CommandEmpty>No inventory found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="all"
                                    onSelect={(e) => {
                                        clearFilter({
                                            stopPropagation: () => {},
                                        });
                                        setOpen(false);
                                    }}
                                    className="font-medium text-muted-foreground"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !currentInventoryId
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    Semua Inventory
                                </CommandItem>
                                {inventories.map((inventory) => (
                                    <CommandItem
                                        key={inventory.id}
                                        value={inventory.id.toString()} // Value for selection
                                        keywords={[inventory.name]} // Ensure searching by name works
                                        onSelect={() =>
                                            onSelect(inventory.id.toString())
                                        }
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                currentInventoryId ===
                                                    inventory.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {inventory.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
