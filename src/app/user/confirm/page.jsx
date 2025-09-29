"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import SessionsTable from "./components/SessionsTable";
import RefreshButton from "./components/RefreshButton";
import { getConfirmableSessions } from "./actions";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function ConfirmPage() {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getConfirmableSessions();

            if (result.success) {
                setSessions(result.data);
            } else {
                setError(result.error || "Gagal memuat data session");
            }
        } catch (err) {
            setError("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRefresh = () => {
        fetchSessions();
    };

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalProducts = sessions.reduce(
        (sum, session) => sum + session.productCount,
        0
    );
    const totalQuantity = sessions.reduce(
        (sum, session) => sum + session.totalQuantity,
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Konfirmasi Dokumen
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola dan konfirmasi dokumen yang dibuat oleh checker
                    </p>
                </div>
                <RefreshButton
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                />
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Dokumen
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {totalSessions}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Dokumen dalam status draft
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Products
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {totalProducts}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Produk yang di-scan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Quantity
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {totalQuantity}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Total quantity produk
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert for role information */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Informasi:</strong> Hanya dokumen dengan status
                    "DRAFT" yang dibuat oleh checker yang dapat dikonfirmasi.
                    Setelah dikonfirmasi, Dokumen akan berubah menjadi status
                    "CONFIRMED" dan siap untuk diproses lebih lanjut oleh admin.
                </AlertDescription>
            </Alert>

            {/* Error display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading skeleton */}
            {isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Skeleton className="h-6 w-48" />
                        </CardTitle>
                        <CardDescription>
                            <Skeleton className="h-4 w-96" />
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center space-x-4"
                            >
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ) : (
                /* Sessions table */
                <SessionsTable sessions={sessions} onRefresh={handleRefresh} />
            )}
        </div>
    );
}
