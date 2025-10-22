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
import { useState } from "react";
import { toast } from "sonner";
import GenerateZeroQtyDialog from "./GenerateZeroQtyDialog";

const State = (state) => {
    if (state.state === "draft") {
        return <Badge variant={"secondary"}>DRAFT</Badge>;
    } else if (state.state === "confirm") {
        return <Badge variant={"default"}>IN PROGRESS</Badge>;
    } else if (state.state === "done") {
        return (
            <Badge variant={"outline"} className={"bg-green-600 text-white"}>
                DONE
            </Badge>
        );
    }
};

export default function DocumentsTable({ documents, locations }) {
    const [downloadingId, setDownloadingId] = useState(null);

    const handleDownloadExcel = async (inventoryId, docName) => {
        try {
            setDownloadingId(inventoryId);

            // Fetch file dari API
            const response = await fetch(
                `/api/document/${inventoryId}/download`
            );

            if (!response.ok) {
                throw new Error("Failed to download Excel");
            }

            // Convert response ke blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${docName || `inventory_${inventoryId}`}.xlsx`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading Excel:", error);
            toast.error("Gagal mendownload file Excel. Silakan coba lagi.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-end">
                <GenerateZeroQtyDialog
                    documents={documents}
                    locations={locations}
                />
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead className="w-[50px]">User</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Status Di Server</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Lokasi</TableHead>
                            <TableHead>Baris</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!documents || documents.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Tidak ada dokumen untuk ditampilkan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc, index) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {doc.create_uid?.[1] || "Unknown User"}
                                    </TableCell>
                                    <TableCell>{doc.name}</TableCell>
                                    <TableCell>
                                        <State state={doc.state} />
                                    </TableCell>
                                    <TableCell>{doc.date}</TableCell>
                                    <TableCell>
                                        {doc.location_id?.[1]}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={"outline"}>
                                            {doc.line_ids.length}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            onClick={() =>
                                                handleDownloadExcel(
                                                    doc.id,
                                                    doc.name
                                                )
                                            }
                                            className="cursor-pointer hover:bg-primary/90"
                                        >
                                            {downloadingId === doc.id
                                                ? "Downloading..."
                                                : "Excel"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
