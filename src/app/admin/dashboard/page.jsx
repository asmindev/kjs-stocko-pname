import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth/next";
import Dashboard from "./components/dashboard-page";
import {
    getAllInventoryIdsByType,
    getLeaders,
    getTotalProductsCount,
} from "./services/actions";

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
        type = "cycle",
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
        session.user.email,
    );

    // Conditional fetching based on active tab
    const activeTab = tab || "warehouse";

    // Fetch Odoo Data (conditionally fetch leaders only when needed)
    const [warehousesData, locationsData, leaders, totalOdooProducts] =
        await Promise.all([
            odoo.getWarehouses(),
            odoo.getInventoryLocations(),
            activeTab === "leader" ? getLeaders(odoo) : Promise.resolve([]),
            getTotalProductsCount(warehouse, type),
        ]);

    const warehouses = warehousesData.warehouses;
    const locations = locationsData.locations;

    // Determine Filter
    const where = {};
    let selectedWarehouse = null;
    let selectedLeader = null;

    // === TYPE FILTER STRATEGY ===
    // 1. Query Odoo for ALL inventory IDs of the chosen type (cycle vs annual)
    // 2. Find local Documents whose inventory_id matches
    // 3. Products WITH matching document_id → filtered correctly
    // 4. Products WITHOUT document_id → legacy data, shown on both tabs

    // Step 1: Get ALL Odoo inventory IDs for this type
    const allOdooInventoryIds = await getAllInventoryIdsByType(odoo, type);
    console.log(
        `[DASHBOARD] type=${type}, Odoo inventories found: ${allOdooInventoryIds.length}`,
    );

    if (warehouse) {
        const warehouseSessions = await prisma.session.findMany({
            where: { warehouse_id: parseInt(warehouse) },
            select: { id: true },
        });
        const sessionIds = warehouseSessions.map((s) => s.id);

        // Find documents for this warehouse that match the type
        const matchingDocs = await prisma.document.findMany({
            where: {
                warehouse_id: parseInt(warehouse),
                inventory_id: { in: allOdooInventoryIds },
            },
            select: { id: true },
        });
        const matchingDocIds = matchingDocs.map((d) => d.id);

        // Also find doc IDs for this warehouse that DON'T match the type
        const nonMatchingDocs = await prisma.document.findMany({
            where: {
                warehouse_id: parseInt(warehouse),
                inventory_id: { notIn: allOdooInventoryIds, not: null },
            },
            select: { id: true },
        });
        const nonMatchingDocIds = nonMatchingDocs.map((d) => d.id);

        console.log(
            `[DASHBOARD] warehouse=${warehouse}, sessions: ${sessionIds.length}, matching docs: ${matchingDocIds.length}, non-matching docs: ${nonMatchingDocIds.length}`,
        );

        // Products that match:
        // - Products linked to a matching document (correct type)
        // - For CYCLE: Products with NO document_id but state is DRAFT/CONFIRMED (active unposted work)
        // - For ANNUAL/STANDARD: Products with NO document_id (legacy data + unposted annual if any)
        const orConditions = [{ document_id: { in: matchingDocIds } }];

        if (type === "cycle") {
            // For cycle: include unposted active work
            orConditions.push({
                document_id: null,
                state: { in: ["DRAFT", "CONFIRMED"] },
            });
        } else {
            // For annual: include all legacy (POSTED) products without documents
            orConditions.push({
                document_id: null,
                state: "POST",
            });
        }

        where.AND = [
            { session_id: { in: sessionIds } },
            { OR: orConditions },
            // Exclude products linked to documents of the WRONG type
            {
                NOT: {
                    document_id: { in: nonMatchingDocIds },
                },
            },
        ];

        selectedWarehouse = warehouses.find(
            (w) => w.lot_stock_id[0] === parseInt(warehouse),
        );
    } else if (leader) {
        selectedLeader = leaders.find((l) => l.id === parseInt(leader));
        if (selectedLeader?.inventory_product_location_ids?.length) {
            const leaderLocationIds =
                selectedLeader.inventory_product_location_ids;

            // Find documents for products in this leader's locations that match the type
            const matchingDocs = await prisma.document.findMany({
                where: {
                    inventory_id: { in: allOdooInventoryIds },
                    products: {
                        some: { location_id: { in: leaderLocationIds } },
                    },
                },
                select: { id: true },
            });
            const matchingDocIds = matchingDocs.map((d) => d.id);

            const nonMatchingDocs = await prisma.document.findMany({
                where: {
                    inventory_id: { notIn: allOdooInventoryIds, not: null },
                    products: {
                        some: { location_id: { in: leaderLocationIds } },
                    },
                },
                select: { id: true },
            });
            const nonMatchingDocIds = nonMatchingDocs.map((d) => d.id);

            const orConditions = [{ document_id: { in: matchingDocIds } }];

            if (type === "cycle") {
                orConditions.push({
                    document_id: null,
                    state: { in: ["DRAFT", "CONFIRMED"] },
                });
            } else {
                orConditions.push({
                    document_id: null,
                    state: "POST",
                });
            }

            where.location_id = { in: leaderLocationIds };
            where.OR = orConditions;

            if (nonMatchingDocIds.length > 0) {
                where.NOT = { document_id: { in: nonMatchingDocIds } };
            }
        } else if (selectedLeader) {
            where.id = -1;
        }
    } else {
        // Global Type Filter (when no warehouse/leader selected)
        const matchingDocs = await prisma.document.findMany({
            where: { inventory_id: { in: allOdooInventoryIds } },
            select: { id: true },
        });
        const matchingDocIds = matchingDocs.map((d) => d.id);

        const nonMatchingDocs = await prisma.document.findMany({
            where: { inventory_id: { notIn: allOdooInventoryIds, not: null } },
            select: { id: true },
        });
        const nonMatchingDocIds = nonMatchingDocs.map((d) => d.id);

        const orConditions = [{ document_id: { in: matchingDocIds } }];

        if (type === "cycle") {
            orConditions.push({
                document_id: null,
                state: { in: ["DRAFT", "CONFIRMED"] },
            });
        } else {
            orConditions.push({
                document_id: null,
                state: "POST",
            });
        }

        where.OR = orConditions;

        if (nonMatchingDocIds.length > 0) {
            where.NOT = { document_id: { in: nonMatchingDocIds } };
        }
    }

    if (search) {
        // Preserve existing type filter and add search on top
        const existingConditions = { ...where };
        const searchCondition = {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
            ],
        };
        // Merge: keep all existing filters AND add search
        Object.assign(where, {
            AND: [...(where.AND || [existingConditions]), searchCondition],
        });
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
            (l) => l.stock_location_id[0] === selectedWarehouse.lot_stock_id[0],
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
        (l) => !dbLocationNames.includes(l.display_name),
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
