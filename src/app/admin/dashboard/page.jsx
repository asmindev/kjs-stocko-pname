import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth/next";
import Dashboard from "./components/dashboard-page";

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

    const odoo = await OdooSessionManager.getClient(
        session.user.id,
        session.user.email
    );

    if (!odoo) {
        // remove session from database
        await prisma.session.deleteMany({
            where: {
                user_id: parseInt(session.user.id),
            },
        });
        // sign out user
    }

    // step 1: get warehouse list from odoo
    const warehouses = await odoo.getWarehouses();

    // step 2: get session list from database
    const sessions = await prisma.session.findMany({
        include: {
            products: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });
    // step 3: show pie chart ('DRAFT', 'POST') of Inventory Adjusmants, with filter by warehouse use combo
    return (
        <div className="w-full mx-auto">
            <Dashboard warehouses={warehouses.warehouses} sessions={sessions} />
        </div>
    );
}
