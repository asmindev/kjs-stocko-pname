import { ChevronDown, Users, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LeaderSelector({
    leaders,
    selectedLeader,
    onLeaderChange,
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="min-w-[200px] justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedLeader ? selectedLeader.name : "Pilih Leader"}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[250px]">
                <DropdownMenuItem onClick={() => onLeaderChange(null)}>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Semua Leader
                    </div>
                </DropdownMenuItem>
                {leaders?.map((leader) => (
                    <DropdownMenuItem
                        key={leader.id}
                        onClick={() => onLeaderChange(leader)}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <div className="font-medium">{leader.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {leader.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {leader.inventory_product_location_ids
                                        ?.length || 0}{" "}
                                    lokasi
                                </div>
                            </div>
                            {selectedLeader?.id === leader.id && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
