import { ChevronDown, Package, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WarehouseSelector({
    warehouses,
    selectedWarehouse,
    onWarehouseChange,
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="min-w-[200px] justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {selectedWarehouse
                            ? selectedWarehouse.name
                            : "Pilih Warehouse"}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[250px]">
                <DropdownMenuItem onClick={() => onWarehouseChange(null)}>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Semua Warehouse
                    </div>
                </DropdownMenuItem>
                {warehouses?.map((warehouse) => (
                    <DropdownMenuItem
                        key={warehouse.id}
                        onClick={() => onWarehouseChange(warehouse)}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <div className="font-medium">
                                    {warehouse.code}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {warehouse.name}
                                </div>
                            </div>
                            {selectedWarehouse?.id === warehouse.id && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
