"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateZeroQuantity } from "../actions";

export default function GenerateZeroQtyDialog({ documents, locations }) {
    const [open, setOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Filter dokumen berdasarkan warehouse yang dipilih
    const getFilteredDocuments = () => {
        console.log({ selectedLocation });
        if (!selectedLocation || !documents) return [];

        return documents.filter(
            (doc) => doc.location_id[0] === parseInt(selectedLocation)
        );
    };

    const handleGenerate = async () => {
        if (!selectedLocation) {
            toast.error("Silahkan pilih warehouse location terlebih dahulu");
            return;
        }

        const filteredDocs = getFilteredDocuments();

        if (filteredDocs.length === 0) {
            toast.error("Tidak ada dokumen dengan warehouse yang dipilih");
            return;
        }

        setLoading(true);
        try {
            // Extract inventory_ids dari dokumen yang difilter
            const inventoryIds = filteredDocs.map((doc) => doc.id);

            if (inventoryIds.length === 0) {
                throw new Error("Tidak ada inventory ID yang valid");
            }

            // Call server action
            const result = await generateZeroQuantity(
                inventoryIds,
                parseInt(selectedLocation)
            );

            if (!result.success) {
                throw new Error(
                    result.error || "Failed to generate zero quantity"
                );
            }

            toast.success(
                `Zero quantity inventory berhasil dibuat dengan ${
                    result.line_count || 0
                } lines`
            );

            setOpen(false);
            setSelectedLocation("");
            router.refresh();
        } catch (error) {
            console.error("Generate zero qty error:", error);
            toast.error(error.message || "Gagal generate zero quantity");
        } finally {
            setLoading(false);
        }
    };

    const filteredCount = selectedLocation ? getFilteredDocuments().length : 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Generate Zero Qty
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Zero Quantity Inventory</DialogTitle>
                    <DialogDescription>
                        Pilih warehouse location untuk membuat inventory dengan
                        quantity 0 untuk produk yang belum tercatat.
                        {selectedLocation && (
                            <>
                                <br />
                                <span className="text-sm font-medium mt-2 block">
                                    Dokumen dengan warehouse ini:{" "}
                                    {filteredCount}
                                </span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">
                        Warehouse Location
                    </label>
                    <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih warehouse location..." />
                        </SelectTrigger>
                        <SelectContent>
                            {locations && locations.length > 0 ? (
                                locations.map((location) => (
                                    <SelectItem
                                        key={location[0]}
                                        value={location[0]}
                                    >
                                        {location[1]}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-data" disabled>
                                    Tidak ada data warehouse
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
