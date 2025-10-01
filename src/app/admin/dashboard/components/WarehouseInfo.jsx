import { Package } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function WarehouseInfo({ selectedWarehouse }) {
    if (!selectedWarehouse) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {selectedWarehouse.name}
                </CardTitle>
                <CardDescription>
                    Kode: {selectedWarehouse.code} | Stock Location:{" "}
                    {selectedWarehouse.lot_stock_id[1]}
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
