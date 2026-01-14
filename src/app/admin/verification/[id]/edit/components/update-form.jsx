import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationSelector } from "./location-selector";
import { LocationBadges } from "./location-badges";
import { VerifierSelector } from "./verifier-selector";

/**
 * Update form component - main form for adding verification entries
 */
export function UpdateForm({
    // Values
    totalActualQty,
    currentTotal,
    adjustmentQty,
    selectedLocationIds,
    selectedLocations,
    newVerifierId,
    selectedVerifierName,
    newNote,
    verificationDateTime,
    loading,
    
    // Setters
    onTotalActualChange,
    onLocationSelectionChange,
    onVerifierChange,
    onNoteChange,
    onDateTimeChange,
    
    // State controls
    openLocation,
    setOpenLocation,
    openVerifier,
    setOpenVerifier,
    
    // Data
    locations,
    users,
    
    // Handler
    onSubmit,
}) {
    const handleLocationRemove = (locationId) => {
        onLocationSelectionChange(selectedLocationIds.filter(id => id !== locationId));
    };

    return (
        <div className="border rounded-lg p-3 bg-green-50/30">
            <div className="flex items-center gap-2 mb-3">
                <PackagePlus className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Update Stok (Total Real)</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-start">
                {/* Total Actual Input */}
                <div className="w-32">
                    <Label className="text-xs font-bold text-green-800">
                        Total Aktual (Real)
                    </Label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder={currentTotal.toString()}
                        value={totalActualQty}
                        onChange={(e) => onTotalActualChange(e.target.value)}
                        className="h-9 font-bold bg-white border-green-300 focus-visible:ring-green-500"
                    />
                </div>

                {/* Location Selector */}
                <div className="flex-1 min-w-[180px]">
                    <LocationSelector
                        locations={locations}
                        selectedIds={selectedLocationIds}
                        onSelectionChange={onLocationSelectionChange}
                        open={openLocation}
                        onOpenChange={setOpenLocation}
                    />
                    <LocationBadges
                        locations={selectedLocations}
                        onRemove={handleLocationRemove}
                    />
                </div>

                {/* Verifier Selector */}
                <VerifierSelector
                    users={users}
                    selectedId={newVerifierId}
                    onSelect={onVerifierChange}
                    selectedName={selectedVerifierName}
                    open={openVerifier}
                    onOpenChange={setOpenVerifier}
                />

                {/* Note */}
                <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs">Keterangan</Label>
                    <Textarea
                        placeholder="Catatan tambahan (opsional)"
                        value={newNote}
                        onChange={(e) => onNoteChange(e.target.value)}
                        className="h-9 min-h-[36px] text-xs resize-none"
                        rows={1}
                    />
                </div>

                {/* DateTime Input (Single Field) */}
                <div className="w-48">
                    <Label className="text-xs">Tanggal & Jam</Label>
                    <Input
                        type="datetime-local"
                        value={verificationDateTime || ""}
                        onChange={(e) => onDateTimeChange(e.target.value)}
                        className="h-9 text-xs"
                    />
                </div>

                {/* Submit Button with Confirmation */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={
                                loading ||
                                !totalActualQty ||
                                adjustmentQty === 0 ||
                                selectedLocationIds.length === 0 ||
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
                            <AlertDialogTitle>Konfirmasi Update Stok</AlertDialogTitle>
                            <div>
                                <div className="space-y-2 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Saat Ini:</span>
                                        <span className="font-medium">{currentTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Total Aktual (Baru):</span>
                                        <span className="font-bold">{totalActualQty}</span>
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
                                            {adjustmentQty > 0 ? "+" : ""}
                                            {adjustmentQty}
                                        </span>
                                    </div>
                                </div>
                                <span className="mt-4 text-xs text-muted-foreground block">
                                    System akan menambahkan entry adjustment sebesar{" "}
                                    <strong>{adjustmentQty}</strong>.
                                </span>
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={onSubmit}>
                                Ya, Update Stok
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
