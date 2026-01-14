import { Badge } from "@/components/ui/badge";

/**
 * Display selected locations as badges with remove buttons
 */
export function LocationBadges({ locations, onRemove }) {
    if (locations.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {locations.map((loc) => (
                <Badge
                    key={loc.id}
                    variant="secondary"
                    className="text-xs pl-2 pr-1 py-0.5 flex items-center gap-1"
                >
                    <span className="truncate max-w-[150px]">
                        {loc.display_name?.split("/").pop() || loc.display_name}
                    </span>
                    <button
                        type="button"
                        onClick={() => onRemove(loc.id)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                        <span className="text-[10px] font-bold">×</span>
                    </button>
                </Badge>
            ))}
        </div>
    );
}
