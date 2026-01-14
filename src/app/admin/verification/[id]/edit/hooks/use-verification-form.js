import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateVerificationTotal, deleteVerificationEntry } from "../action";
import {
    calculateTotals,
    filterScansByLocation,
} from "../utils/verification-helpers";

/**
 * Custom hook for verification form state and logic
 * @param {Object} line - Inventory line data
 * @param {Array} locations - Available locations
 * @param {Array} users - Available users/verifiers
 * @returns {Object} Form state, handlers, and computed values
 */
export function useVerificationForm(line, locations, users) {
    const router = useRouter();

    // ===== STATE =====
    const [loading, setLoading] = useState(false);
    const [totalActualQty, setTotalActualQty] = useState("");
    const [selectedLocationIds, setSelectedLocationIds] = useState([]);
    const [newVerifierId, setNewVerifierId] = useState("");
    const [newNote, setNewNote] = useState("");
    const [verificationDateTime, setVerificationDateTime] = useState("");
    const [openLocation, setOpenLocation] = useState(false);
    const [openVerifier, setOpenVerifier] = useState(false);

    // ===== COMPUTED VALUES =====

    // Entries from props
    const entries = line.entries || [];

    // Location IDs for filtering
    const locationIds = locations.map((loc) => loc.id);

    // Filtered scans
    const previousScans = useMemo(
        () => filterScansByLocation(line.previousScans || [], locationIds),
        [line.previousScans, locationIds]
    );

    // Totals
    const { verified: totalVerified, scanned: totalScanned } = useMemo(
        () => calculateTotals(entries, previousScans),
        [entries, previousScans]
    );

    // Current total from Odoo
    const currentTotal = line.product_qty || 0;

    // Adjustment quantity
    const adjustmentQty = useMemo(() => {
        if (!totalActualQty) return 0;
        return parseFloat(totalActualQty) - currentTotal;
    }, [totalActualQty, currentTotal]);

    // Selected locations objects
    const selectedLocations = useMemo(() => {
        return selectedLocationIds
            .map((id) => locations.find((l) => l.id === id))
            .filter(Boolean);
    }, [selectedLocationIds, locations]);

    // Selected verifier name
    const selectedVerifierName = useMemo(() => {
        const user = users.find((u) => String(u.id) === newVerifierId);
        return user ? user.name : "Pilih Verifikator";
    }, [newVerifierId, users]);

    // ===== HANDLERS =====

    /**
     * Handle form submission
     */
    const handleAddEntry = async () => {
        // Validation
        if (!totalActualQty) {
            toast.error("Mohon masukkan total aktual");
            return;
        }

        if (adjustmentQty === 0) {
            toast.error(
                "Total aktual sama dengan total saat ini. Tidak ada perubahan."
            );
            return;
        }

        if (selectedLocationIds.length === 0) {
            toast.error("Mohon pilih minimal satu lokasi");
            return;
        }

        if (!newVerifierId) {
            toast.error("Mohon pilih verifikator");
            return;
        }

        setLoading(true);
        try {
            const result = await updateVerificationTotal(
                line.id,
                totalActualQty,
                selectedLocationIds,
                newVerifierId,
                newNote,
                verificationDateTime
            );

            if (result.success) {
                toast.success(result.message || "Data berhasil ditambahkan");

                // Reset form
                setTotalActualQty("");
                setSelectedLocationIds([]);
                setNewVerifierId("");
                setNewNote("");
                setVerificationDateTime("");

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

    /**
     * Handle entry deletion
     */
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

    // ===== RETURN =====
    return {
        // State
        loading,
        totalActualQty,
        selectedLocationIds,
        newVerifierId,
        newNote,
        verificationDateTime,
        openLocation,
        openVerifier,

        // Computed
        entries,
        previousScans,
        totalVerified,
        totalScanned,
        currentTotal,
        adjustmentQty,
        selectedLocations,
        selectedVerifierName,

        // Setters
        setTotalActualQty,
        setSelectedLocationIds,
        setNewVerifierId,
        setNewNote,
        setVerificationDateTime,
        setOpenLocation,
        setOpenVerifier,

        // Handlers
        handleAddEntry,
        handleDeleteEntry,
    };
}
