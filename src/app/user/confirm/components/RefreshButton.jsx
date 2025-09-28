"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const RefreshButton = ({ onRefresh, isLoading }) => {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
        >
            <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{isLoading ? "Memuat..." : "Refresh"}</span>
        </Button>
    );
};

export default RefreshButton;
