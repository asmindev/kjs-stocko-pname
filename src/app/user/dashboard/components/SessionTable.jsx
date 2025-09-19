"use client";

import { useState } from "react";
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

export default function SessionTable({ sessions, onViewDetail }) {
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm");
        } catch (error) {
            return "Invalid Date";
        }
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
                    <CardTitle>Riwayat Scan Session</CardTitle>
                    <CardDescription>
                        Belum ada session scan yang tersimpan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Mulai scan barcode untuk membuat session baru
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Scan Session</CardTitle>
                <CardDescription>
                    Daftar semua session scan yang telah dibuat
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Session</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Jumlah Produk</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id}>
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
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewDetail(session.id)}
                                    >
                                        Detail
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
