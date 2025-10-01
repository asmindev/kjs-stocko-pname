import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth/next";
import Dashboard from "./components/dashboard-page";
import { getLeaders } from "./services/actions";

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

    // step 1: get warehouse list from odoo
    const warehouses = await odoo.getWarehouses();
    // step 2: get inventory locations from odoo
    const locations = await odoo.getInventoryLocations();

    // step 3: get session list from database
    // get leaders
    const leaders = await getLeaders(odoo);
    const products = await prisma.product.findMany({
        include: {
            session: true,
            User: true,
        },
    });
    return (
        <div className="w-full mx-auto">
            <Dashboard
                warehouses={warehouses.warehouses}
                locations={locations.locations}
                leaders={leaders}
                products={products}
            />
        </div>
    );
}
