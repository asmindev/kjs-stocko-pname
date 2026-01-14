import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Verification entries table with delete functionality
 */
export function VerificationTable({ entries, onDelete, getLocationName, getVerifierName, loading, total }) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-green-100 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                    Log Verifikasi ({entries.length})
                </span>
                <Badge variant="outline" className="bg-white text-green-700">
                    Total: {total > 0 ? "+" : ""}{total}
                </Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="text-xs">
                        <TableHead className="py-2">Adj Qty</TableHead>
                        <TableHead className="py-2">Lokasi</TableHead>
                        <TableHead className="py-2">Verifikator</TableHead>
                        <TableHead className="py-2 w-8"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-center py-6 text-xs text-muted-foreground"
                            >
                                Belum ada data
                            </TableCell>
                        </TableRow>
                    ) : (
                        entries.map((entry) => (
                            <TableRow key={entry.id} className="text-xs">
                                <TableCell
                                    className={cn(
                                        "py-2 font-bold",
                                        entry.product_qty > 0
                                            ? "text-green-600"
                                            : entry.product_qty < 0
                                            ? "text-red-600"
                                            : ""
                                    )}
                                >
                                    {entry.product_qty > 0 ? "+" : ""}
                                    {entry.product_qty}
                                </TableCell>
                                <TableCell
                                    className="py-2 truncate max-w-[120px]"
                                    title={getLocationName(entry.location_id)}
                                >
                                    {getLocationName(entry.location_id).split("/").pop()}
                                </TableCell>
                                <TableCell className="py-2">
                                    {getVerifierName(entry.verifier_id)}
                                </TableCell>
                                <TableCell className="py-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                                disabled={loading}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menghapus data verifikasi ini?
                                                    Tindakan ini tidak dapat dibatalkan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        onDelete(entry.id, entry.odoo_verification_id)
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
