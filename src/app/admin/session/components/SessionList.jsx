"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Calendar,
    User,
    Package,
    Building,
    Eye,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/ui/pagination-controls";

export default function SessionList({
    sessions,
    pagination,
    searchParams,
    stats,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParamsHook = useSearchParams();

    // Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams?.search || "");
    const [stateFilter, setStateFilter] = useState(
        searchParams?.state || "all"
    );

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams?.search || "")) {
                const params = new URLSearchParams(searchParamsHook);
                if (searchTerm) {
                    params.set("search", searchTerm);
                } else {
                    params.delete("search");
                }
                params.set("page", "1"); // Reset to page 1 on search
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, pathname, searchParamsHook, searchParams?.search]);

    // Sync state with URL params (for back/forward navigation)
    useEffect(() => {
        setSearchTerm(searchParams?.search || "");
        setStateFilter(searchParams?.state || "all");
    }, [searchParams]);

    const handleStateFilterChange = (value) => {
        setStateFilter(value);
        const params = new URLSearchParams(searchParamsHook);
        if (value && value !== "all") {
            params.set("state", value);
        } else {
            params.delete("state");
        }
        params.set("page", "1"); // Reset to page 1 on filter
        router.push(`${pathname}?${params.toString()}`);
    };

    // Get state badge variant
    const getStateBadge = (state) => {
        switch (state) {
            case "DRAFT":
                return {
                    variant: "secondary",
                    color: "bg-gray-100 text-gray-800",
                };
            case "CONFIRMED":
                return {
                    variant: "default",
                    color: "bg-blue-100 text-blue-800",
                };
            case "POST":
                return {
                    variant: "outline",
                    color: "bg-yellow-100 text-yellow-800",
                };
            case "DONE":
                return {
                    variant: "default",
                    color: "bg-green-100 text-green-800",
                };
            default:
                return {
                    variant: "secondary",
                    color: "bg-gray-100 text-gray-800",
                };
        }
    };

    // Calculate session statistics for rows
    const getSessionStats = (session) => {
        const productStates = session.products.reduce((acc, product) => {
            acc[product.state] = (acc[product.state] || 0) + 1;
            return acc;
        }, {});

        const totalQuantity = session.products.reduce(
            (sum, product) => sum + product.quantity,
            0
        );

        return {
            totalProducts: session._count.products,
            totalQuantity,
            productStates,
        };
    };

    return (
        <div className="space-y-6">
            {/* Overview Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Total Sessions
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stats.totalSessions}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Package className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Total Products
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stats.totalProducts}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="h-5 w-5 text-yellow-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Draft Sessions
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stats.byState?.DRAFT || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Building className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Completed
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stats.byState?.DONE || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Session List</CardTitle>
                    <CardDescription>
                        Kelola dan monitor semua session inventory
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Cari session berdasarkan nama, warehouse, atau user..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* State Filter */}
                        <Select
                            value={stateFilter}
                            onValueChange={handleStateFilterChange}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by state" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Status
                                </SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="CONFIRMED">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="POST">Posted</SelectItem>
                                <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Control */}
                        <Select
                            value={`${searchParams?.sortBy || "created_at"}-${
                                searchParams?.sortOrder || "desc"
                            }`}
                            onValueChange={(value) => {
                                const [sortBy, sortOrder] = value.split("-");
                                const params = new URLSearchParams(
                                    searchParamsHook
                                );
                                params.set("sortBy", sortBy);
                                params.set("sortOrder", sortOrder);
                                router.push(`${pathname}?${params.toString()}`);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at-desc">
                                    Terbaru
                                </SelectItem>
                                <SelectItem value="created_at-asc">
                                    Terlama
                                </SelectItem>
                                <SelectItem value="name-asc">
                                    Nama (A-Z)
                                </SelectItem>
                                <SelectItem value="name-desc">
                                    Nama (Z-A)
                                </SelectItem>
                                <SelectItem value="warehouse_name-asc">
                                    Warehouse (A-Z)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results Info */}
                    <div className="mb-4 text-sm text-gray-600">
                        {pagination?.totalCount > 0 ? (
                            <>
                                Menampilkan {sessions.length} dari{" "}
                                {pagination.totalCount} session
                                {searchTerm &&
                                    ` untuk pencarian "${searchTerm}"`}
                            </>
                        ) : (
                            "Tidak ada data"
                        )}
                    </div>

                    {/* Session Table */}
                    {sessions.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Session Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Warehouse</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Products</TableHead>
                                        <TableHead>Total Qty</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => {
                                        const stats = getSessionStats(session);
                                        const stateBadge = getStateBadge(
                                            session.state
                                        );

                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">
                                                    {session.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            stateBadge.color
                                                        }
                                                    >
                                                        {session.state}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Building className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm">
                                                            {session.warehouse_name ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {session.user
                                                                    ?.name ||
                                                                    "N/A"}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {
                                                                    session.user
                                                                        ?.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Package className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {
                                                                stats.totalProducts
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">
                                                        {stats.totalQuantity}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-gray-500" />
                                                        <div>
                                                            <div className="text-sm">
                                                                {new Date(
                                                                    session.created_at
                                                                ).toLocaleDateString(
                                                                    "id-ID"
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(
                                                                    session.created_at
                                                                ).toLocaleTimeString(
                                                                    "id-ID",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/session/${session.id}`}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">
                                Tidak ada session ditemukan
                            </p>
                            <p className="text-sm mt-1">
                                {searchTerm || stateFilter !== "all"
                                    ? "Coba ubah filter atau kata kunci pencarian"
                                    : "Belum ada session yang dibuat"}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && (
                        <div className="mt-4">
                            <PaginationControls
                                totalCount={pagination.totalCount}
                                pageSize={pagination.limit}
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                pageSizeOptions={[10, 20, 30, 50]}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
