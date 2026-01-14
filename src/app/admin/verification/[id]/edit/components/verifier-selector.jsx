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
 * Single-select verifier selector component
 */
export function VerifierSelector({
    users,
    selectedId,
    onSelect,
    selectedName,
    open,
    onOpenChange,
}) {
    return (
        <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">Verifikator</Label>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-9 justify-between text-xs"
                    >
                        <span className="truncate">{selectedName}</span>
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0">
                    <Command>
                        <CommandInput placeholder="Cari..." />
                        <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {users.map((user) => {
                                    const userId = String(user.id);
                                    return (
                                        <CommandItem
                                            key={userId}
                                            value={`${user.name} ${user.login}`}
                                            onSelect={() => {
                                                onSelect(userId);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3 w-3",
                                                    selectedId === userId
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <span className="text-xs">
                                                {user.name}
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
