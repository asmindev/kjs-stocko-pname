import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Check, ChevronsUpDown, UserRound, X } from "lucide-react";
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

export default function OwnerSelect({
    value = "",
    selectedName = "",
    onValueChange,
    disabled = false,
    placeholder = "Pilih owner (opsional)",
    clearable = true,
}) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    const cacheRef = useRef(new Map());

    const normalizedValue = value ? String(value) : "";

    const filteredOwners = owners;

    const selectedOwner = useMemo(() => {
        if (!normalizedValue) return null;
        return (
            owners.find((owner) => String(owner.id) === normalizedValue) || null
        );
    }, [owners, normalizedValue]);

    const fetchOwners = async (query) => {
        const key = (query || "").trim().toLowerCase();
        if (cacheRef.current.has(key)) {
            setOwners(cacheRef.current.get(key));
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);

        try {
            const params = new URLSearchParams({
                q: query || "",
                limit: "50",
            });
            const response = await fetch(
                `/api/owner/search?${params.toString()}`,
                {
                    signal: controller.signal,
                },
            );
            const result = await response.json();
            const data = Array.isArray(result?.data) ? result.data : [];
            cacheRef.current.set(key, data);
            setOwners(data);
        } catch (error) {
            if (error.name !== "AbortError") {
                setOwners([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        fetchTimeoutRef.current = setTimeout(() => {
            fetchOwners(searchValue);
        }, 300);

        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [open, searchValue]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, []);

    const handleChange = useCallback(
        (ownerId) => {
            if (ownerId === "clear") {
                onValueChange?.({
                    res_partner_id: null,
                    res_partner_name: "",
                });
                setOpen(false);
                return;
            }

            const selected = owners.find(
                (owner) => String(owner.id) === String(ownerId),
            );
            onValueChange?.({
                res_partner_id: selected?.id || null,
                res_partner_name: selected?.name || "",
            });
            setOpen(false);
        },
        [owners, onValueChange],
    );

    const handleOpenChange = useCallback((nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setSearchValue("");
        }
    }, []);

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
                        <UserRound className="h-4 w-4 shrink-0" />
                        <span className="truncate text-left">
                            {selectedOwner?.name || selectedName || placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Cari owner..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        className="border-0 focus:ring-0"
                    />
                    <CommandList className="overflow-hidden">
                        {loading && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                Memuat owner...
                            </div>
                        )}
                        {filteredOwners.length === 0 ? (
                            <CommandEmpty className="py-6 text-center text-sm">
                                {searchValue
                                    ? `Tidak ditemukan owner dengan kata "${searchValue}"`
                                    : "Tidak ada owner tersedia"}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {clearable && selectedOwner && (
                                    <>
                                        <CommandItem
                                            value="clear"
                                            onSelect={() =>
                                                handleChange("clear")
                                            }
                                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <X className="h-4 w-4" />
                                                <span className="font-medium">
                                                    Hapus owner
                                                </span>
                                            </div>
                                        </CommandItem>
                                        <div className="border-t my-1" />
                                    </>
                                )}

                                <div className="max-h-[300px] overflow-y-auto">
                                    {filteredOwners.map((owner) => {
                                        const isSelected =
                                            String(owner.id) ===
                                            normalizedValue;
                                        return (
                                            <CommandItem
                                                key={owner.id}
                                                value={String(owner.id)}
                                                onSelect={() =>
                                                    handleChange(owner.id)
                                                }
                                                className="cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4",
                                                            isSelected
                                                                ? "opacity-100"
                                                                : "opacity-0",
                                                        )}
                                                    />
                                                    <span className="truncate">
                                                        {owner.name}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        );
                                    })}
                                </div>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
