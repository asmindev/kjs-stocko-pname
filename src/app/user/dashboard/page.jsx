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
async function DashboardContent() {
    const sessionsResult = await getSessions();

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

    return <DashboardClient sessions={sessionsResult.data} />;
}

// Main Dashboard Page
export default function DashboardPage() {
    return (
        <div className="container mx-auto">
            <Suspense fallback={<LoadingCard />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}
