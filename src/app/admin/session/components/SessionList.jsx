"use client";

import React, { useState, useMemo } from "react";
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

export default function SessionList({ sessions }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

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

    // Calculate session statistics
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

    // Filter and search sessions
    const filteredSessions = useMemo(() => {
        let filtered = sessions;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (session) =>
                    session.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    session.warehouse_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    session.user?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    session.user?.email
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        // Apply state filter
        if (stateFilter !== "all") {
            filtered = filtered.filter(
                (session) => session.state === stateFilter
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.created_at) - new Date(a.created_at);
                case "oldest":
                    return new Date(a.created_at) - new Date(b.created_at);
                case "name":
                    return a.name.localeCompare(b.name);
                case "products":
                    return b._count.products - a._count.products;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [sessions, searchTerm, stateFilter, sortBy]);

    // Get overview statistics
    const overviewStats = useMemo(() => {
        const total = sessions.length;
        const byState = sessions.reduce((acc, session) => {
            acc[session.state] = (acc[session.state] || 0) + 1;
            return acc;
        }, {});

        const totalProducts = sessions.reduce(
            (sum, session) => sum + session._count.products,
            0
        );

        return {
            total,
            byState,
            totalProducts,
        };
    }, [sessions]);

    return (
        <div className="space-y-6">
            {/* Overview Statistics */}
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
                                    {overviewStats.total}
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
                                    {overviewStats.totalProducts}
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
                                    {overviewStats.byState.DRAFT || 0}
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
                                    {overviewStats.byState.DONE || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                            onValueChange={setStateFilter}
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

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Terbaru</SelectItem>
                                <SelectItem value="oldest">Terlama</SelectItem>
                                <SelectItem value="name">Nama A-Z</SelectItem>
                                <SelectItem value="products">
                                    Jumlah Produk
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results Info */}
                    <div className="mb-4 text-sm text-gray-600">
                        Menampilkan {filteredSessions.length} dari{" "}
                        {sessions.length} session
                        {searchTerm && ` untuk pencarian "${searchTerm}"`}
                    </div>

                    {/* Session Table */}
                    {filteredSessions.length > 0 ? (
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
                                    {filteredSessions.map((session) => {
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
                                                    {/* Product State Summary */}
                                                    {stats.totalProducts >
                                                        0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {Object.entries(
                                                                stats.productStates
                                                            ).map(
                                                                ([
                                                                    state,
                                                                    count,
                                                                ]) => (
                                                                    <Badge
                                                                        key={
                                                                            state
                                                                        }
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {state}:{" "}
                                                                        {count}
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
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
                </CardContent>
            </Card>
        </div>
    );
}
