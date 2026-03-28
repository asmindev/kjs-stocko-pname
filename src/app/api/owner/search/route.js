import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OdooSessionManager } from "@/lib/sessionManager";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "50", 10) || 50,
            100,
        );

        const client = await OdooSessionManager.getClient(
            session.user.id,
            session.user.email,
        );

        const result = await client.getResPartners({
            searchQuery: q,
            limit,
        });

        return NextResponse.json({
            success: true,
            data: result.partners || [],
        });
    } catch (error) {
        console.error("Error searching owners:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch owners",
                details: error.message,
            },
            { status: 500 },
        );
    }
}
