import { toast } from "sonner";

export const actionExportToExcel = async (selectedWarehouse) => {
    if (!selectedWarehouse) {
        toast.error("Silakan pilih warehouse terlebih dahulu");
        return;
    }

    // Gunakan lot_stock_id[0] sesuai dengan filter di dashboard
    const warehouseId = selectedWarehouse.lot_stock_id[0];
    console.log(
        "selected warehouseId for export:",
        selectedWarehouse,
        warehouseId
    );

    toast.promise(
        fetch(`/api/export/excel?warehouseId=${warehouseId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Export failed");
                return res.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `products_${selectedWarehouse.name}_${
                    new Date().toISOString().split("T")[0]
                }.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return "File berhasil diunduh!";
            }),
        {
            loading: "Mempersiapkan data...",
            success: (message) => message,
            error: "Gagal mengekspor data ke Excel.",
        }
    );
};
