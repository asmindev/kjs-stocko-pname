"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { redirect, RedirectType } from "next/navigation";

export default function SessionTable({ sessions }) {
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm");
        } catch (error) {
            return "Invalid Date";
        }
    };

    const onViewDetail = (session) => {
        // Handle view detail session
        // redirect ke halaman detail session
        redirect(`/user/session/${session.id}`, RedirectType.push);
    };

    const getStateBadgeVariant = (state) => {
        switch (state) {
            case "DRAFT":
                return "secondary";
            case "POST":
                return "default";
            default:
                return "outline";
        }
    };

    if (!sessions || sessions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Perhitungan</CardTitle>
                    <CardDescription>
                        Belum ada Dokumen yang tersimpan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Mulai scan barcode untuk membuat dokumen
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Perhitungan</CardTitle>
                <CardDescription>
                    Daftar semua checker yang telah dibuat
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Dokumen</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Jumlah Produk</TableHead>
                            <TableHead>User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow
                                key={session.id}
                                onClick={() => onViewDetail(session)}
                                className="cursor-pointer hover:bg-accent"
                            >
                                <TableCell className="font-medium">
                                    {session.name || `Session #${session.id}`}
                                </TableCell>
                                <TableCell>
                                    {formatDate(session.created_at)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={getStateBadgeVariant(
                                            session.state
                                        )}
                                    >
                                        {session.state}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {session.productCount} produk
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {session.user?.name || "Unknown User"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
