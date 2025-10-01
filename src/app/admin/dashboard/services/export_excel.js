import { toast } from "sonner";

export const actionExportToExcel = async () => {
    toast.promise(
        fetch("/api/export/excel")
            .then((res) => {
                if (!res.ok) throw new Error("Export failed");
                return res.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `products_${
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
