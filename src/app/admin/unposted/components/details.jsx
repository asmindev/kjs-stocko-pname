"use client";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnpostedDetails({ productData, warehouseName }) {
    console.log("UnpostedDetails productData:", productData);
    const router = useRouter();

    if (
        !productData ||
        !productData.details ||
        productData.details.length === 0
    ) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <CardTitle>Detail Produk</CardTitle>
                            <CardDescription>
                                Tidak ada detail untuk produk ini
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {productData.product}{" "}
                                <Badge
                                    variant="outline"
                                    className="cursor-copy select-all"
                                >
                                    {productData.barcode}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Warehouse: {warehouseName} | Total Qty:{" "}
                                {productData.qty}{" "}
                                {productData.needsConversion
                                    ? productData.targetUom?.name || ""
                                    : productData.originalUom?.name || ""}
                                {productData.needsConversion && (
                                    <Badge
                                        variant="outline"
                                        className="ml-2 text-xs"
                                    >
                                        Converted
                                    </Badge>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto rounded-md border">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[5px]">#</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Qty Asli</TableHead>
                                    <TableHead>Qty Konversi</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productData.details.map((d, i) => (
                                    <TableRow key={`detail-${i}`}>
                                        <TableCell className="font-medium">
                                            {i + 1}
                                        </TableCell>
                                        <TableCell>
                                            {d.user?.name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {d.quantity} {d.uom?.name || ""}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default">
                                                {d.convertedQuantity ||
                                                    d.quantity}{" "}
                                                {productData.needsConversion
                                                    ? productData.targetUom
                                                          ?.name || ""
                                                    : productData.originalUom
                                                          ?.name || ""}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                d.created_at
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {d.session?.name ||
                                                `#${d.session?.id}`}
                                        </TableCell>
                                        <TableCell>
                                            {d.location?.name || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
