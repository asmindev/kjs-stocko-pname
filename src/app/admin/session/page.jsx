import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { SessionPageContent } from "./components";

export default async function SessionPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.is_admin) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-600">
                        You do not have permission to view this page.
                    </p>
                </div>
            </div>
        );
    }

    // Fetch sessions with related data
    const sessions = await prisma.session.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            products: {
                select: {
                    id: true,
                    quantity: true,
                    state: true,
                },
            },
            _count: {
                select: {
                    products: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Session Management
                </h1>
                <p className="text-gray-600 mt-2">
                    Kelola dan monitor semua session inventory
                </p>
            </div>

            <SessionPageContent sessions={sessions} />
        </div>
    );
}
