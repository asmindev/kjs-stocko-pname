"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Package, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { getSessionById } from "../services/actions";

export default function SessionDetail({ sessionId, onBack }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSessionDetail = async () => {
            try {
                setLoading(true);
                const result = await getSessionById(sessionId);

                if (result.success) {
                    setSession(result.data);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                setError("Terjadi kesalahan saat mengambil data session");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            fetchSessionDetail();
        }
    }, [sessionId]);

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
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

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <p>Memuat detail session...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center text-red-500">
                        <p>Error: {error}</p>
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="mt-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!session) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <p>Session tidak ditemukan</p>
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="mt-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header dengan tombol kembali */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>
                <h1 className="text-2xl font-bold">Detail Session</h1>
            </div>

            {/* Info Session */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {session.name || `Session #${session.id}`}
                    </CardTitle>
                    <CardDescription>
                        Informasi detail session scan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Tanggal Dibuat
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(session.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">User</p>
                                <p className="text-sm text-muted-foreground">
                                    {session.user?.name || "Unknown User"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <Badge
                                    variant={getStateBadgeVariant(
                                        session.state
                                    )}
                                >
                                    {session.state}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daftar Produk */}
            <Card>
                <CardHeader>
                    <CardTitle>Produk yang Discan</CardTitle>
                    <CardDescription>
                        Total {session.products.length} produk dalam session ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {session.products.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Belum ada produk yang discan dalam session ini
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead className="min-w-[300px]">
                                        Nama Produk
                                    </TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>UOM</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {session.products.map((product, index) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <code className="px-2 py-1 bg-muted rounded text-sm">
                                                {product.barcode}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {product.name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {product.quantity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.uom_id || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
