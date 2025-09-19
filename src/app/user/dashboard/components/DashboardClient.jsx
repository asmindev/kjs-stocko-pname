"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import SessionTable from "./SessionTable";
import SessionDetail from "./SessionDetail";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User2 } from "lucide-react";

// Client Component untuk handle state
export default function DashboardClient({ sessions }) {
    const { data: session } = useSession();
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [isDetailView, setIsDetailView] = useState(false);

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
                    Kelola dan lihat riwayat session scan produk Anda
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
                            Total Sesi
                        </CardTitle>
                        <User2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sessions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            session scan tersimpan
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions Table */}
            <SessionTable sessions={sessions} onViewDetail={handleViewDetail} />
        </div>
    );
}
