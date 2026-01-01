import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { SessionPageContent } from "./components";

export default async function SessionPage({ searchParams }) {
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

    const {
        page: pageParam,
        limit: limitParam,
        search,
        state,
        sortBy = "created_at",
        sortOrder = "desc",
    } = await searchParams;

    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 20;
    const skip = (page - 1) * limit;
    const searchTerm = search || "";
    const stateFilter = state && state !== "all" ? state : undefined;

    // Build where clause
    const where = {
        AND: [
            stateFilter ? { state: stateFilter } : {},
            searchTerm
                ? {
                      OR: [
                          {
                              name: {
                                  contains: searchTerm,
                                  mode: "insensitive",
                              },
                          },
                          {
                              warehouse_name: {
                                  contains: searchTerm,
                                  mode: "insensitive",
                              },
                          },
                          {
                              user: {
                                  name: {
                                      contains: searchTerm,
                                      mode: "insensitive",
                                  },
                              },
                          },
                          {
                              user: {
                                  email: {
                                      contains: searchTerm,
                                      mode: "insensitive",
                                  },
                              },
                          },
                      ],
                  }
                : {},
        ],
    };

    // Get total count for pagination
    const totalCount = await prisma.session.count({ where });

    // Get stats for dashboard cards (global stats, not filtered by search)
    const [totalProducts, namesByState] = await Promise.all([
        prisma.product.count(),
        prisma.session.groupBy({
            by: ["state"],
            _count: {
                state: true,
            },
        }),
    ]);

    const statsByState = namesByState.reduce((acc, curr) => {
        acc[curr.state] = curr._count.state;
        return acc;
    }, {});

    // Fetch sessions with related data
    const sessions = await prisma.session.findMany({
        where,
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
            [sortBy]: sortOrder,
        },
        skip,
        take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

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

            <SessionPageContent
                sessions={sessions}
                pagination={{
                    page,
                    limit,
                    totalCount,
                    totalPages,
                }}
                searchParams={{
                    search: searchTerm,
                    state: stateFilter || "all",
                    sortBy,
                    sortOrder,
                }}
                stats={{
                    totalSessions: await prisma.session.count(), // Global count unrelated to filter
                    totalProducts,
                    byState: statsByState,
                }}
            />
        </div>
    );
}
