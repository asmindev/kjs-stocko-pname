"use client";

import React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
    { value: "positive", label: "Positif (+)" },
    { value: "negative", label: "Negatif (-)" },
    { value: "balance", label: "Balance (0)" },
];

export function MultiSelectStatusFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current statuses from URL
    const currentStatuses = searchParams.get("status")?.split(",").filter(Boolean) || [];

    const toggleStatus = (value) => {
        const params = new URLSearchParams(searchParams);
        let nextStatuses;

        if (currentStatuses.includes(value)) {
            nextStatuses = currentStatuses.filter((s) => s !== value);
        } else {
            nextStatuses = [...currentStatuses, value];
        }

        if (nextStatuses.length === 0) {
            params.delete("status");
        } else {
            params.set("status", nextStatuses.join(","));
        }

        params.set("page", "1"); // Reset pagination
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("status");
        params.set("page", "1");
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Status:</span>
                        {currentStatuses.length === 0 ? (
                            <span>Semua</span>
                        ) : (
                            <div className="flex gap-1">
                                <Badge variant="secondary" className="px-1 font-normal">
                                    {currentStatuses.length} terpilih
                                </Badge>
                            </div>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="end">
                <div className="space-y-2">
                    {STATUS_OPTIONS.map((option) => (
                        <div
                            key={option.value}
                            className="flex items-center space-x-2 hover:bg-accent p-1 rounded-md cursor-pointer"
                            onClick={() => toggleStatus(option.value)}
                        >
                            <Checkbox
                                id={`status-${option.value}`}
                                checked={currentStatuses.includes(option.value)}
                                onCheckedChange={() => toggleStatus(option.value)}
                            />
                            <label
                                htmlFor={`status-${option.value}`}
                                className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                                {option.label}
                            </label>
                        </div>
                    ))}
                    
                    {currentStatuses.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={clearFilters}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Bersihkan Filter
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
