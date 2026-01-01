"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import SessionTable from "./SessionTable";
import SessionDetail from "../../session/[id]/SessionDetail";
import PaginationControls from "@/components/ui/pagination-controls";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User2 } from "lucide-react";

// Client Component untuk handle state
// Client Component untuk handle state
export default function DashboardClient({ sessions, pagination }) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [isDetailView, setIsDetailView] = useState(false);
    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );

    // Debounce search update
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                const params = new URLSearchParams(searchParams);
                if (searchTerm) {
                    params.set("search", searchTerm);
                } else {
                    params.delete("search");
                }
                params.set("page", "1"); // Reset to page 1
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, pathname, searchParams]);

    const handleViewDetail = (sessionId) => {
        setSelectedSessionId(sessionId);
        setIsDetailView(true);
    };

    const handleBackToList = () => {
        setSelectedSessionId(null);
        setIsDetailView(false);
    };

    if (isDetailView && selectedSessionId) {
        return (
            <SessionDetail
                sessionId={selectedSessionId}
                onBack={handleBackToList}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Kelola dan lihat Riwayat Perhitungan Anda
                </p>
                {session?.user && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        Selamat datang,
                        <span className="font-medium">{session.user.name}</span>
                    </p>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            Total Dokumen
                        </CardTitle>
                        <User2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {pagination?.totalCount || sessions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Dokumen tersimpan
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions Table */}
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Cari session..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Sessions Table */}
            <SessionTable sessions={sessions} />

            {/* Pagination */}
            {pagination && (
                <PaginationControls
                    totalCount={pagination.totalCount}
                    pageSize={pagination.limit}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                />
            )}
        </div>
    );
}
