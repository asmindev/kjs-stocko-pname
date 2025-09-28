"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { confirmSessions, getSessionDetails } from "../actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const SessionsTable = ({ sessions, onRefresh }) => {
    const [selectedSessions, setSelectedSessions] = useState(new Set());
    const [isConfirming, setIsConfirming] = useState(false);

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            const allSessionIds = sessions.map((session) => session.id);
            setSelectedSessions(new Set(allSessionIds));
        } else {
            setSelectedSessions(new Set());
        }
    };

    // Handle individual session checkbox
    const handleSelectSession = (sessionId, checked) => {
        const newSelected = new Set(selectedSessions);
        if (checked) {
            newSelected.add(sessionId);
        } else {
            newSelected.delete(sessionId);
        }
        setSelectedSessions(newSelected);
    };

    // Handle confirm selected sessions
    const handleConfirmSessions = async () => {
        if (selectedSessions.size === 0) {
            toast.error("Pilih minimal satu session untuk dikonfirmasi");
            return;
        }

        setIsConfirming(true);
        try {
            const result = await confirmSessions(Array.from(selectedSessions));

            if (result.success) {
                toast.success(
                    `Berhasil mengkonfirmasi ${result.confirmedCount} session`
                );
                setSelectedSessions(new Set());
                onRefresh();
            } else {
                toast.error(result.error || "Gagal mengkonfirmasi session");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengkonfirmasi session");
        } finally {
            setIsConfirming(false);
        }
    };

    // Handle view session details

    const allSelected =
        sessions.length > 0 && selectedSessions.size === sessions.length;
    const someSelected =
        selectedSessions.size > 0 && selectedSessions.size < sessions.length;

    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Tidak Ada Session
                    </h3>
                    <p className="text-muted-foreground text-center">
                        Belum ada session dalam status draft yang dapat
                        dikonfirmasi.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Actions bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        {selectedSessions.size} dari {sessions.length} session
                        dipilih
                    </p>
                </div>
                <Button
                    onClick={handleConfirmSessions}
                    disabled={selectedSessions.size === 0 || isConfirming}
                    size="sm"
                >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isConfirming
                        ? "Mengkonfirmasi..."
                        : `Konfirmasi (${selectedSessions.size})`}
                </Button>
            </div>

            {/* Sessions table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Session - Status Draft</CardTitle>
                    <CardDescription>
                        Session yang dibuat oleh checker dan siap untuk
                        dikonfirmasi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Pilih semua session"
                                        {...(someSelected && {
                                            "data-state": "indeterminate",
                                        })}
                                    />
                                </TableHead>
                                <TableHead>Session</TableHead>
                                <TableHead>Checker</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Total Qty</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedSessions.has(
                                                session.id
                                            )}
                                            onCheckedChange={(checked) =>
                                                handleSelectSession(
                                                    session.id,
                                                    checked
                                                )
                                            }
                                            aria-label={`Pilih session ${session.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {session.name}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <p className="font-medium">
                                                    {session.user?.name}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.warehouse_name ? (
                                            <div className="flex items-center space-x-2">
                                                <span>
                                                    {session.warehouse_name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-center">
                                            <span className="font-medium">
                                                {session.productCount}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                items
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-center">
                                            <span className="font-medium">
                                                {session.totalQuantity}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                total
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(
                                                new Date(session.created_at),
                                                "dd MMM yyyy",
                                                { locale: id }
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(
                                                        session.created_at
                                                    ),
                                                    "HH:mm"
                                                )}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="flex items-center space-x-1"
                                        >
                                            <span className="uppercase">
                                                {session.state}
                                            </span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/user/session/${session.id}`}
                                        >
                                            <Button variant="outline" size="sm">
                                                Lihat Detail
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SessionsTable;
