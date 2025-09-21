import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export default async function page() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.is_admin) {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    // step 1: get warehouse list from odoo
    // step 2: get session list from database
    // step 3: show pie chart ('DRAFT', 'POST') of sessions, with filter by warehouse use combobox
    return (
        <div>
            <h1>Admin Dashboard</h1>
        </div>
    );
}
