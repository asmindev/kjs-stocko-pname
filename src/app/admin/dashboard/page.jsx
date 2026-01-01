import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth/next";
import Dashboard from "./components/dashboard-page";
import { getLeaders, getTotalProductsCount } from "./services/actions";

export default async function page({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.is_admin) {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const {
        warehouse,
        leader,
        tab,
        page: pageParam,
        limit: limitParam,
        search,
        sortBy = "created_at",
        sortOrder = "desc",
    } = await searchParams;

    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 20;
    const skip = (page - 1) * limit;

    const odoo = await OdooSessionManager.getClient(
        session.user.id,
        session.user.email
    );

    // Conditional fetching based on active tab
    const activeTab = tab || "warehouse";

    // Fetch Odoo Data (conditionally fetch leaders only when needed)
    const [warehousesData, locationsData, leaders, totalOdooProducts] =
        await Promise.all([
            odoo.getWarehouses(),
            odoo.getInventoryLocations(),
            activeTab === "leader" ? getLeaders(odoo) : Promise.resolve([]),
            getTotalProductsCount(),
        ]);

    const warehouses = warehousesData.warehouses;
    const locations = locationsData.locations;

    // Determine Filter
    const where = {};
    let selectedWarehouse = null;
    let selectedLeader = null;

    if (warehouse) {
        // Fetch session IDs first to avoid ambiguous column error in groupBy (Product.state vs Session.state)
        const warehouseSessions = await prisma.session.findMany({
            where: { warehouse_id: parseInt(warehouse) },
            select: { id: true },
        });
        const sessionIds = warehouseSessions.map((s) => s.id);

        where.session_id = { in: sessionIds };

        selectedWarehouse = warehouses.find(
            (w) => w.lot_stock_id[0] === parseInt(warehouse)
        );
    } else if (leader) {
        selectedLeader = leaders.find((l) => l.id === parseInt(leader));
        if (selectedLeader?.inventory_product_location_ids?.length) {
            where.location_id = {
                in: selectedLeader.inventory_product_location_ids,
            };
        } else if (selectedLeader) {
            // Leader has no locations, ensure no products match
            where.id = -1;
        }
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
        ];
    }

    // Aggregations matching useDashboardData / useLeaderData
    const [
        totalProductsFiltered,
        stateAggregation,
        locationAggregation,
        totalQuantityAgg,
    ] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.groupBy({
            by: ["state"],
            where,
            _count: { state: true },
        }),
        prisma.product.groupBy({
            by: ["location_name"],
            where,
            _sum: { quantity: true },
        }),
        prisma.product.aggregate({
            where,
            _sum: { quantity: true },
        }),
    ]);

    // Format Aggregations
    const stateCount = stateAggregation.reduce((acc, curr) => {
        acc[curr.state] = curr._count.state;
        return acc;
    }, {});

    const locationCount = locationAggregation.reduce((acc, curr) => {
        const locName = curr.location_name || "Unknown";
        acc[locName] = curr._sum.quantity || 0;
        return acc;
    }, {});

    // Calculate derived stats
    let targetLocations = [];
    if (selectedWarehouse) {
        targetLocations = locations.filter(
            (l) => l.stock_location_id[0] === selectedWarehouse.lot_stock_id[0]
        );
    } else if (selectedLeader) {
        const leaderLocIds =
            selectedLeader.inventory_product_location_ids || [];
        targetLocations = locations.filter((l) => leaderLocIds.includes(l.id));
    }

    const dbLocationNames = locationAggregation
        .map((l) => l.location_name)
        .filter(Boolean);
    const locationsWithoutProducts = targetLocations.filter(
        (l) => !dbLocationNames.includes(l.display_name)
    ).length;

    const stats = {
        totalProducts: totalProductsFiltered,
        totalQuantity: totalQuantityAgg._sum.quantity || 0,
        stateCount,
        locationCount,
        locationsWithProducts: dbLocationNames.length,
        locationsWithoutProducts,
        statePercentages: {},
    };

    if (totalProductsFiltered > 0) {
        Object.keys(stateCount).forEach((state) => {
            stats.statePercentages[state] = (
                (stateCount[state] / totalProductsFiltered) *
                100
            ).toFixed(1);
        });
    }

    // Construct OrderBy
    let orderBy = {};
    if (sortBy === "warehouse_name") {
        orderBy = { session: { warehouse_name: sortOrder } };
    } else if (sortBy === "user_name") {
        orderBy = { User: { name: sortOrder } };
    } else if (sortBy === "session_name") {
        orderBy = { session: { name: sortOrder } };
    } else {
        orderBy = { [sortBy]: sortOrder };
    }

    // Fetch Paginated Products
    const products = await prisma.product.findMany({
        where,
        include: {
            session: true,
            User: true,
        },
        orderBy,
        skip,
        take: limit,
    });

    const totalPages = Math.ceil(totalProductsFiltered / limit);

    return (
        <div className="w-full mx-auto">
            <Dashboard
                warehouses={warehouses}
                locations={locations}
                leaders={leaders}
                paginatedProducts={products}
                pagination={{
                    page,
                    limit,
                    total: totalProductsFiltered,
                    totalPages,
                }}
                serverStats={stats}
                totalOdooProducts={totalOdooProducts}
                selectedWarehouse={selectedWarehouse}
                selectedLeader={selectedLeader}
                searchParams={searchParams}
            />
        </div>
    );
}
