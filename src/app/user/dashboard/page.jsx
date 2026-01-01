export const dynamic = "force-dynamic";
import { Suspense } from "react";
import DashboardClient from "./components/DashboardClient";
import { getSessions } from "./services/actions";
import { Card, CardContent } from "@/components/ui/card";

// Loading component
function LoadingCard() {
    return (
        <Card>
            <CardContent className="p-8">
                <div className="text-center">
                    <p>Memuat data...</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Dashboard Content Component
async function DashboardContent({ searchParams }) {
    const page = parseInt(searchParams?.page) || 1;
    const limit = parseInt(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const sessionsResult = await getSessions({ page, limit, search });

    if (!sessionsResult.success) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center text-red-500">
                        <p>Error: {sessionsResult.error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <DashboardClient
            sessions={sessionsResult.data}
            pagination={sessionsResult.pagination}
        />
    );
}

// Main Dashboard Page
export default async function DashboardPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    return (
        <div className="container mx-auto">
            <Suspense fallback={<LoadingCard />}>
                <DashboardContent searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    );
}
