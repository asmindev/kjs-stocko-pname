"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";

// Custom Hook
import { useVerificationForm } from "./hooks/use-verification-form";

// Utility Functions
import { getLocationName, getVerifierName } from "./utils/verification-helpers";

// UI Components
import { ProductHeader } from "./components/product-header";
import { SummaryStats } from "./components/summary-stats";
import { UpdateForm } from "./components/update-form";
import { VerificationTable } from "./components/verification-table";
import { ScanHistoryTable } from "./components/scan-history-table";

/**
 * Main Verification Edit Form Component
 * Orchestrates all sub-components
 */
export function VerificationEditForm({ line, locations, users }) {
    const router = useRouter();

    // Use custom hook for all state management
    const form = useVerificationForm(line, locations, users);

    return (
        <div>
            <CardContent className="space-y-4 pt-4">
                {/* Product Header */}
                <ProductHeader
                    productName={line.product_name}
                    barcode={line.barcode}
                    locationName={line.location_name}
                />

                {/* Summary Statistics */}
                <SummaryStats
                    systemQty={line.system_qty}
                    scannedQty={form.totalScanned}
                    diffQty={line.diff_qty}
                    currentTotal={form.currentTotal}
                />

                {/* Update Form */}
                <UpdateForm
                    // Values
                    totalActualQty={form.totalActualQty}
                    currentTotal={form.currentTotal}
                    adjustmentQty={form.adjustmentQty}
                    selectedLocationIds={form.selectedLocationIds}
                    selectedLocations={form.selectedLocations}
                    newVerifierId={form.newVerifierId}
                    selectedVerifierName={form.selectedVerifierName}
                    newNote={form.newNote}
                    verificationDateTime={form.verificationDateTime}
                    loading={form.loading}
                    // Setters
                    onTotalActualChange={form.setTotalActualQty}
                    onLocationSelectionChange={form.setSelectedLocationIds}
                    onVerifierChange={form.setNewVerifierId}
                    onNoteChange={form.setNewNote}
                    onDateTimeChange={form.setVerificationDateTime}
                    // State controls
                    openLocation={form.openLocation}
                    setOpenLocation={form.setOpenLocation}
                    openVerifier={form.openVerifier}
                    setOpenVerifier={form.setOpenVerifier}
                    // Data
                    locations={locations}
                    users={users}
                    // Handler
                    onSubmit={form.handleAddEntry}
                />

                {/* Two Column Layout for Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Verification Entries Table */}
                    <VerificationTable
                        entries={form.entries}
                        onDelete={form.handleDeleteEntry}
                        getLocationName={(id) => getLocationName(id, locations)}
                        getVerifierName={(id) => getVerifierName(id, users)}
                        loading={form.loading}
                        total={form.totalVerified}
                    />

                    {/* Scan History Table */}
                    <ScanHistoryTable
                        scans={form.previousScans}
                        total={form.totalScanned}
                    />
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
