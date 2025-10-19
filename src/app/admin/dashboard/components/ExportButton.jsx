"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { actionExportToExcel } from "../services/export_excel";

export default function ExportButton({ selectedWarehouse }) {
    return (
        <Button
            onClick={() => actionExportToExcel(selectedWarehouse)}
            className="flex items-center gap-2"
            disabled={!selectedWarehouse}
        >
            <Download className="h-4 w-4" />
            Export to Excel
        </Button>
    );
}
