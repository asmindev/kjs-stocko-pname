import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

/**
 * Scan history table - read-only display
 */
export function ScanHistoryTable({ scans, total }) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-amber-100 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-amber-800">
                    <History className="h-3 w-3 inline mr-1" />
                    Riwayat Scan ({scans.length})
                </span>
                <Badge variant="outline" className="bg-white text-amber-700">
                    {total}
                </Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="text-xs">
                        <TableHead className="py-2">Qty</TableHead>
                        <TableHead className="py-2">Lokasi</TableHead>
                        <TableHead className="py-2">Scanner</TableHead>
                        <TableHead className="py-2">Waktu</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {scans.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-center py-6 text-xs text-muted-foreground"
                            >
                                Tidak ada riwayat
                            </TableCell>
                        </TableRow>
                    ) : (
                        scans.map((scan) => (
                            <TableRow key={scan.id} className="text-xs">
                                <TableCell className="py-2 font-bold">
                                    {scan.quantity}
                                </TableCell>
                                <TableCell
                                    className="py-2 truncate max-w-[100px]"
                                    title={scan.location_name}
                                >
                                    {scan.location_name?.split("/").pop() ||
                                        "N/A"}
                                </TableCell>
                                <TableCell className="py-2">
                                    {scan.User?.name || "-"}
                                </TableCell>
                                <TableCell className="py-2 text-muted-foreground">
                                    {new Date(
                                        scan.created_at
                                    ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                    })}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
