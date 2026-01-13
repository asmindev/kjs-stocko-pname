"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CardContent, CardFooter } from "@/components/ui/card";
import { deleteVerificationEntry, updateVerificationTotal } from "../../action";
import {
    Check,
    ChevronsUpDown,
    Trash2,
    Plus,
    History,
    PackagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export function VerificationEditForm({ line, locations, users }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Existing Entries
    const entries = line.entries || [];

    // Filter previous scans by location
    const location_ids = locations.map((loc) => loc.id);
    const previousScans = (line.previousScans || []).filter((scan) =>
        location_ids.includes(scan.location_id)
    );

    // Calculate totals
    const totalVerified = entries.reduce((sum, e) => sum + e.product_qty, 0);
    const totalScanned = previousScans.reduce((sum, s) => sum + s.quantity, 0);

    // Base Total (Odoo Scan + Verified)
    // Note: line.product_qty comes from Odoo as "Scanned Qty" usually.
    // Let's verify: in action.js, line.product_qty is scanned_qty.
    // Wait, in action.js:
    // item.scanned_qty = line.product_qty
    // item.total_qty = originalScannedQty + additionalQty
    // So current total known to system is line.total_qty (if we pass the enriched line object)
    // Let's check `getVerificationLine` in action.js
    // It returns `...odooResult` and `entries`.
    // data.entries = localEntries.
    // It does NOT doing the calculation `total_qty` like `getVerificationData` list.

    // We need to calculate Current Total here.
    // IMPORTANT: line.product_qty from Odoo ALREADY includes all adjustments
    // (Odoo updates product_qty when verification is added via set_verification_total_qty)
    // So we should NOT add totalVerified again, otherwise we double count.
    // The display "Verifikasi Tambahan" shows the HISTORY of adjustments, not additional qty.
    const currentTotal = line.product_qty || 0;

    // Form State for NEW Entry (Total Actual)
    const [totalActualQty, setTotalActualQty] = useState("");

    // Calculate Adjustment preview
    const adjustmentQty = useMemo(() => {
        if (!totalActualQty) return 0;
        return parseFloat(totalActualQty) - currentTotal;
    }, [totalActualQty, currentTotal]);

    // Location Combobox State
    const [openLocation, setOpenLocation] = useState(false);
    const [newLocationId, setNewLocationId] = useState("");

    // Verifier Combobox State
    const [openVerifier, setOpenVerifier] = useState(false);
    const [newVerifierId, setNewVerifierId] = useState("");

    // Note State
    const [newNote, setNewNote] = useState("");

    // Helper to get location name for display in table
    const getLocationName = (id) => {
        const loc = locations.find((l) => l.id === id);
        return loc ? loc.display_name : "Lokasi Tidak Diketahui";
    };

    // Helper to get verifier name
    const getVerifierName = (id) => {
        const user = users.find((u) => String(u.id) === String(id));
        return user ? user.name : "Tidak Diketahui";
    };

    // Selected Location Name for Button
    const selectedLocationName = useMemo(() => {
        const loc = locations.find((l) => l.id === newLocationId);
        return loc ? loc.display_name : "Pilih Lokasi";
    }, [locations, newLocationId]);

    // Selected Verifier Name for Button
    const selectedVerifierName = useMemo(() => {
        const user = users.find((u) => String(u.id) === newVerifierId);
        return user ? user.name : "Pilih Verifikator";
    }, [users, newVerifierId]);

    const handleAddEntry = async () => {
        if (!totalActualQty) {
            toast.error("Mohon masukkan total aktual");
            return;
        }

        // Note: AdjustmentQty preview is still useful for UI,
        // but we send the Total Actual to backend now.
        if (adjustmentQty === 0) {
            toast.error(
                "Total aktual sama dengan total saat ini. Tidak ada perubahan."
            );
            return;
        }

        if (!newLocationId) {
            toast.error("Mohon pilih lokasi");
            return;
        }
        if (!newVerifierId) {
            toast.error("Mohon pilih verifikator");
            return;
        }

        setLoading(true);
        try {
            // Use UPDATE TOTAL action (Backend Logic)
            const result = await updateVerificationTotal(
                line.id,
                totalActualQty, // Send TOTAL
                newLocationId,
                newVerifierId,
                newNote
            );

            if (result.success) {
                toast.success(result.message || "Data berhasil ditambahkan");
                setTotalActualQty("");
                setNewLocationId("");
                setNewVerifierId("");
                setNewNote("");
                router.refresh();
            } else {
                toast.error(result.message || "Gagal menambahkan data");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEntry = async (entryId, odooVerificationId = null) => {
        setLoading(true);
        try {
            const result = await deleteVerificationEntry(
                entryId,
                line.id,
                odooVerificationId
            );
            if (result.success) {
                toast.success("Data berhasil dihapus");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Gagal menghapus");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <CardContent className="space-y-4 pt-4">
                {/* Compact Product Header */}
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
                    <h2 className="text-lg font-semibold">
                        {line.product_name}
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs">
                        {line.barcode}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {line.location_name}
                    </Badge>
                </div>

                {/* Compact Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">
                            Qty Sistem
                        </div>
                        <div className="text-xl font-bold">
                            {line.system_qty}
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">
                            Scan Odoo
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                            {line.product_qty}
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">
                            Selisih (Diff)
                        </div>
                        <div className="text-xl font-bold text-green-600">
                            {line.diff_qty || 0}
                        </div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                        <div className="text-xs font-semibold text-indigo-800">
                            TOTAL SAAT INI
                        </div>
                        <div className="text-2xl font-black text-indigo-700">
                            {currentTotal}
                        </div>
                    </div>
                </div>

                {/* Add New Entry - Compact Inline Form */}
                <div className="border rounded-lg p-3 bg-green-50/30">
                    <div className="flex items-center gap-2 mb-3">
                        <PackagePlus className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">
                            Update Stok (Total Real)
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                        <div className="w-32">
                            <Label className="text-xs font-bold text-green-800">
                                Total Aktual (Real)
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={currentTotal.toString()}
                                value={totalActualQty}
                                onChange={(e) =>
                                    setTotalActualQty(e.target.value)
                                }
                                className="h-9 font-bold bg-white border-green-300 focus-visible:ring-green-500"
                            />
                            {totalActualQty && (
                                <div
                                    className={cn(
                                        "text-[10px] font-bold mt-1",
                                        adjustmentQty > 0
                                            ? "text-green-600"
                                            : adjustmentQty < 0
                                            ? "text-red-600"
                                            : "text-gray-500"
                                    )}
                                >
                                    Selisih: {adjustmentQty > 0 ? "+" : ""}
                                    {adjustmentQty}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <Label className="text-xs">Lokasi</Label>
                            <Popover
                                open={openLocation}
                                onOpenChange={setOpenLocation}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full h-9 justify-between text-xs"
                                    >
                                        <span className="truncate">
                                            {selectedLocationName}
                                        </span>
                                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari lokasi..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                Tidak ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {locations.map((loc) => (
                                                    <CommandItem
                                                        key={loc.id}
                                                        value={loc.display_name}
                                                        onSelect={() => {
                                                            setNewLocationId(
                                                                loc.id
                                                            );
                                                            setOpenLocation(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-3 w-3",
                                                                newLocationId ===
                                                                    loc.id
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="text-xs">
                                                            {loc.display_name}
                                                        </span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <Label className="text-xs">Verifikator</Label>
                            <Popover
                                open={openVerifier}
                                onOpenChange={setOpenVerifier}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full h-9 justify-between text-xs"
                                    >
                                        <span className="truncate">
                                            {selectedVerifierName}
                                        </span>
                                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                Tidak ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {users.map((user) => {
                                                    const userId = String(
                                                        user.id
                                                    );
                                                    return (
                                                        <CommandItem
                                                            key={userId}
                                                            value={
                                                                user.name +
                                                                " " +
                                                                user.login
                                                            }
                                                            onSelect={() => {
                                                                setNewVerifierId(
                                                                    userId
                                                                );
                                                                setOpenVerifier(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-3 w-3",
                                                                    newVerifierId ===
                                                                        userId
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            <span className="text-xs">
                                                                {user.name}
                                                            </span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-xs">Keterangan</Label>
                            <Textarea
                                placeholder="Catatan tambahan (opsional)"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="h-9 min-h-[36px] text-xs resize-none"
                                rows={1}
                            />
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    disabled={
                                        loading ||
                                        !totalActualQty ||
                                        adjustmentQty === 0 ||
                                        !newLocationId ||
                                        !newVerifierId
                                    }
                                    size="sm"
                                    className="h-9 mt-4"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Update
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Konfirmasi Update Stok
                                    </AlertDialogTitle>
                                    <div>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Total Saat Ini:</span>
                                                <span className="font-medium">
                                                    {currentTotal}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>
                                                    Total Aktual (Baru):
                                                </span>
                                                <span className="font-bold">
                                                    {totalActualQty}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm border-t pt-2 mt-2">
                                                <span>Adjusment/Selisih:</span>
                                                <span
                                                    className={cn(
                                                        "font-bold",
                                                        adjustmentQty > 0
                                                            ? "text-green-600"
                                                            : adjustmentQty < 0
                                                            ? "text-red-600"
                                                            : ""
                                                    )}
                                                >
                                                    {adjustmentQty > 0
                                                        ? "+"
                                                        : ""}
                                                    {adjustmentQty}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="mt-4 text-xs text-muted-foreground">
                                            System akan menambahkan entry
                                            adjustment sebesar{" "}
                                            <strong>{adjustmentQty}</strong>.
                                        </span>
                                    </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleAddEntry}>
                                        Ya, Update Stok
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Two Column Layout for Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Verification Entries Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-green-100 px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">
                                Log Verifikasi ({entries.length})
                            </span>
                            <Badge
                                variant="outline"
                                className="bg-white text-green-700"
                            >
                                Total: {totalVerified > 0 ? "+" : ""}
                                {totalVerified}
                            </Badge>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="text-xs">
                                    <TableHead className="py-2">
                                        Adj Qty
                                    </TableHead>
                                    <TableHead className="py-2">
                                        Lokasi
                                    </TableHead>
                                    <TableHead className="py-2">
                                        Verifikator
                                    </TableHead>
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
                                        <TableRow
                                            key={entry.id}
                                            className="text-xs"
                                        >
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
                                                {entry.product_qty > 0
                                                    ? "+"
                                                    : ""}
                                                {entry.product_qty}
                                            </TableCell>
                                            <TableCell
                                                className="py-2 truncate max-w-[120px]"
                                                title={getLocationName(
                                                    entry.location_id
                                                )}
                                            >
                                                {getLocationName(
                                                    entry.location_id
                                                )
                                                    .split("/")
                                                    .pop()}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                {getVerifierName(
                                                    entry.verifier_id
                                                )}
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
                                                            <AlertDialogTitle>
                                                                Hapus Data?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Apakah Anda
                                                                yakin ingin
                                                                menghapus data
                                                                verifikasi ini?
                                                                Tindakan ini
                                                                tidak dapat
                                                                dibatalkan.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Batal
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleDeleteEntry(
                                                                        entry.id,
                                                                        entry.odoo_verification_id
                                                                    )
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

                    {/* Scan History Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-amber-100 px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-amber-800">
                                <History className="h-3 w-3 inline mr-1" />
                                Riwayat Scan ({previousScans.length})
                            </span>
                            <Badge
                                variant="outline"
                                className="bg-white text-amber-700"
                            >
                                {totalScanned}
                            </Badge>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="text-xs">
                                    <TableHead className="py-2">Qty</TableHead>
                                    <TableHead className="py-2">
                                        Lokasi
                                    </TableHead>
                                    <TableHead className="py-2">
                                        Scanner
                                    </TableHead>
                                    <TableHead className="py-2">
                                        Waktu
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previousScans.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center py-6 text-xs text-muted-foreground"
                                        >
                                            Tidak ada riwayat
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    previousScans.map((scan) => (
                                        <TableRow
                                            key={scan.id}
                                            className="text-xs"
                                        >
                                            <TableCell className="py-2 font-bold">
                                                {scan.quantity}
                                            </TableCell>
                                            <TableCell
                                                className="py-2 truncate max-w-[100px]"
                                                title={scan.location_name}
                                            >
                                                {scan.location_name
                                                    ?.split("/")
                                                    .pop() || "N/A"}
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
                </div>
            </CardContent>

            <CardFooter className="flex justify-end pt-2 pb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                >
                    Kembali
                </Button>
            </CardFooter>
        </div>
    );
}
