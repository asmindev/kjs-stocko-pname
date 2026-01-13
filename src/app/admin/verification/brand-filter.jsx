"use client";

import React from "react";
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
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export function BrandFilter({ brands = [] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = React.useState(false);

    // Get current brand from URL
    const currentBrandId = searchParams.get("brand");

    // Find name for display
    const selectedBrand = brands.find(
        (b) => b.id.toString() === currentBrandId
    );

    const onSelect = (currentValue) => {
        const params = new URLSearchParams(searchParams);

        // If selecting the same value or null, clear the filter (toggle behavior)
        if (currentValue === currentBrandId) {
            params.delete("brand");
        } else {
            params.set("brand", currentValue);
        }

        params.set("page", "1"); // Reset pagination
        router.push(`${window.location.pathname}?${params.toString()}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {selectedBrand ? selectedBrand.name : "Filter Brand..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Cari brand..." />
                    <CommandList>
                        <CommandEmpty>Brand tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all"
                                onSelect={() => onSelect(null)} // Clear filter
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        !currentBrandId
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                Semua Brand
                            </CommandItem>
                            {brands.map((brand) => (
                                <CommandItem
                                    key={brand.id}
                                    value={brand.id.toString()}
                                    keywords={[brand.name]} // Ensure searchable by name
                                    onSelect={() =>
                                        onSelect(brand.id.toString())
                                    }
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentBrandId ===
                                                brand.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {brand.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
