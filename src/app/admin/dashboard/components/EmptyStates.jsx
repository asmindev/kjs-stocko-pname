import { Package, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ selectedWarehouse }) {
    if (!selectedWarehouse) return null;

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                    Tidak ada data produk
                </h3>
                <p className="text-muted-foreground text-center">
                    Tidak ada produk yang ditemukan untuk warehouse{" "}
                    {selectedWarehouse.name}
                </p>
            </CardContent>
        </Card>
    );
}

export function InitialState({
    title = "Pilih Warehouse untuk Melihat Data",
    description = "Silakan pilih warehouse dari dropdown di atas untuk menampilkan data produk, statistik, dan analisis dashboard.",
}) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                    {description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                        Dashboard akan menampilkan data setelah memilih
                        warehouse
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
