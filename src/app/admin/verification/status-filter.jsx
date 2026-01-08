"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export function StatusFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current status from URL
    const currentStatus = searchParams.get("status") || "all";

    const onValueChange = (value) => {
        const params = new URLSearchParams(searchParams);

        if (value === "all") {
            params.delete("status");
        } else {
            params.set("status", value);
        }

        params.set("page", "1"); // Reset pagination
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <Select value={currentStatus} onValueChange={onValueChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="positive">Positif (+)</SelectItem>
                <SelectItem value="negative">Negatif (-)</SelectItem>
                <SelectItem value="balance">Balance (0)</SelectItem>
            </SelectContent>
        </Select>
    );
}
