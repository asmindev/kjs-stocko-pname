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

export default function DocumentsTable({ documents }) {
    return (
        <div className="w-full overflow-x-auto rounded-md border">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">User</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Status Di Server</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Baris</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!documents || documents.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="h-24 text-center text-muted-foreground"
                            >
                                Tidak ada dokumen untuk ditampilkan.
                            </TableCell>
                        </TableRow>
                    ) : (
                        documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    {doc.create_uid?.[1] || "Unknown User"}
                                </TableCell>
                                <TableCell>{doc.name}</TableCell>
                                <TableCell>
                                    <State state={doc.state} />
                                </TableCell>
                                <TableCell>{doc.date}</TableCell>
                                <TableCell>{doc.location_id?.[1]}</TableCell>
                                <TableCell>
                                    <Badge variant={"outline"}>
                                        {doc.line_ids.length}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
