"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { confirmSessions, getSessionDetails } from "../actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Package,
    CheckCircle2,
    Search,
    Filter,
    X,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/ui/pagination-controls";

const SessionsTable = ({ sessions, pagination, filters, onRefresh }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selectedSessions, setSelectedSessions] = useState(new Set());
    const [isConfirming, setIsConfirming] = useState(false);

    // Initial state from URL
    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );
    const [selectedUser, setSelectedUser] = useState(
        searchParams.get("user") || ""
    );
    const [selectedWarehouse, setSelectedWarehouse] = useState(
        searchParams.get("warehouse") || ""
    );
    const [selectedLocation, setSelectedLocation] = useState(
        searchParams.get("location") || ""
    );

    // Combobox open states
    const [openUser, setOpenUser] = useState(false);
    const [openWarehouse, setOpenWarehouse] = useState(false);
    const [openLocation, setOpenLocation] = useState(false);

    // Sync state with URL params
    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
        setSelectedUser(searchParams.get("user") || "");
        setSelectedWarehouse(searchParams.get("warehouse") || "");
        setSelectedLocation(searchParams.get("location") || "");
    }, [searchParams]);

    // Update URL helper
    const updateUrl = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1"); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                updateUrl("search", searchTerm);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]); // Removed other deps to avoid loops

    const uniqueUsers = filters?.users || [];
    const uniqueWarehouses = filters?.warehouses || [];
    const uniqueLocations = filters?.locations || [];

    // Filter sessions - now just use sessions prop as it's already filtered
    const filteredSessions = sessions;

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setSelectedUser("");
        setSelectedWarehouse("");
        setSelectedLocation("");
        router.push(pathname); // Clear all params
    };

    // Check if any filters are active
    const hasActiveFilters =
        searchTerm || selectedUser || selectedWarehouse || selectedLocation;

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            const allSessionIds = filteredSessions.map((session) => session.id);
            setSelectedSessions(new Set(allSessionIds));
        } else {
            setSelectedSessions(new Set());
        }
    };

    // Handle individual session checkbox
    const handleSelectSession = (sessionId, checked) => {
        const newSelected = new Set(selectedSessions);
        if (checked) {
            newSelected.add(sessionId);
        } else {
            newSelected.delete(sessionId);
        }
        setSelectedSessions(newSelected);
    };

    // Handle confirm selected sessions
    const handleConfirmSessions = async () => {
        if (selectedSessions.size === 0) {
            toast.error("Pilih minimal satu dokumen untuk dikonfirmasi");
            return;
        }

        setIsConfirming(true);
        try {
            const result = await confirmSessions(Array.from(selectedSessions));

            if (result.success) {
                toast.success(
                    `Berhasil mengkonfirmasi ${result.confirmedCount} dokumen`
                );
                setSelectedSessions(new Set());
                onRefresh();
            } else {
                toast.error(result.error || "Gagal mengkonfirmasi dokumen");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengkonfirmasi dokumen");
        } finally {
            setIsConfirming(false);
        }
    };

    // Handle view session details

    const allSelected =
        filteredSessions.length > 0 &&
        selectedSessions.size === filteredSessions.length;
    const someSelected =
        selectedSessions.size > 0 &&
        selectedSessions.size < filteredSessions.length;

    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Tidak Ada Dokumen
                    </h3>
                    <p className="text-muted-foreground text-center">
                        Belum ada dokumen dalam status draft yang dapat
                        dikonfirmasi.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Pencarian dan Filter
                    </CardTitle>
                    <CardDescription>
                        Cari dan filter dokumen berdasarkan kriteria tertentu
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Pencarian Global
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari berdasarkan nama dokumen, checker, warehouse, lokasi, atau produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Filter selects */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Inputter
                            </label>
                            <Popover open={openUser} onOpenChange={setOpenUser}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openUser}
                                        className="w-full justify-between"
                                    >
                                        {selectedUser
                                            ? uniqueUsers.find(
                                                  (user) =>
                                                      user === selectedUser
                                              )
                                            : "Pilih user..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari user..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                User tidak ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedUser("");
                                                        updateUrl("user", "");
                                                        setOpenUser(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedUser === ""
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    Semua User
                                                </CommandItem>
                                                {uniqueUsers.map((user) => (
                                                    <CommandItem
                                                        key={user}
                                                        value={user}
                                                        onSelect={(
                                                            currentValue
                                                        ) => {
                                                            const newValue =
                                                                currentValue ===
                                                                selectedUser
                                                                    ? ""
                                                                    : currentValue;
                                                            setSelectedUser(
                                                                newValue
                                                            );
                                                            updateUrl(
                                                                "user",
                                                                newValue
                                                            );
                                                            setOpenUser(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUser ===
                                                                    user
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {user}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Warehouse
                            </label>
                            <Popover
                                open={openWarehouse}
                                onOpenChange={setOpenWarehouse}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openWarehouse}
                                        className="w-full justify-between"
                                    >
                                        {selectedWarehouse
                                            ? uniqueWarehouses.find(
                                                  (warehouse) =>
                                                      warehouse ===
                                                      selectedWarehouse
                                              )
                                            : "Pilih warehouse..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari warehouse..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                Warehouse tidak ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedWarehouse(
                                                            ""
                                                        );
                                                        updateUrl(
                                                            "warehouse",
                                                            ""
                                                        );
                                                        setOpenWarehouse(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedWarehouse ===
                                                                ""
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    Semua Warehouse
                                                </CommandItem>
                                                {uniqueWarehouses.map(
                                                    (warehouse) => (
                                                        <CommandItem
                                                            key={warehouse}
                                                            value={warehouse}
                                                            onSelect={(
                                                                currentValue
                                                            ) => {
                                                                const newValue =
                                                                    currentValue ===
                                                                    selectedWarehouse
                                                                        ? ""
                                                                        : currentValue;
                                                                setSelectedWarehouse(
                                                                    newValue
                                                                );
                                                                updateUrl(
                                                                    "warehouse",
                                                                    newValue
                                                                );
                                                                setOpenWarehouse(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedWarehouse ===
                                                                        warehouse
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {warehouse}
                                                        </CommandItem>
                                                    )
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Lokasi Produk
                            </label>
                            <Popover
                                open={openLocation}
                                onOpenChange={setOpenLocation}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openLocation}
                                        className="w-full justify-between"
                                    >
                                        {selectedLocation
                                            ? uniqueLocations.find(
                                                  (location) =>
                                                      location ===
                                                      selectedLocation
                                              )
                                            : "Pilih lokasi..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari lokasi..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                Lokasi tidak ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedLocation("");
                                                        updateUrl(
                                                            "location",
                                                            ""
                                                        );
                                                        setOpenLocation(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedLocation ===
                                                                ""
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    Semua Lokasi
                                                </CommandItem>
                                                {uniqueLocations.map(
                                                    (location) => (
                                                        <CommandItem
                                                            key={location}
                                                            value={location}
                                                            onSelect={(
                                                                currentValue
                                                            ) => {
                                                                const newValue =
                                                                    currentValue ===
                                                                    selectedLocation
                                                                        ? ""
                                                                        : currentValue;
                                                                setSelectedLocation(
                                                                    newValue
                                                                );
                                                                updateUrl(
                                                                    "location",
                                                                    newValue
                                                                );
                                                                setOpenLocation(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedLocation ===
                                                                        location
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {location}
                                                        </CommandItem>
                                                    )
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                            <label className="text-sm font-medium text-foreground">
                                Aksi
                            </label>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="w-full"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Reset Filter
                            </Button>
                        </div>
                    </div>

                    {/* Filter summary */}
                    {hasActiveFilters && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                <span>
                                    Menampilkan {filteredSessions.length} dari{" "}
                                    {pagination?.totalCount || sessions.length}{" "}
                                    dokumen
                                </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {hasActiveFilters && (
                                    <>
                                        {searchTerm && "Search"}
                                        {searchTerm &&
                                            (selectedUser ||
                                                selectedWarehouse ||
                                                selectedLocation) &&
                                            " + "}
                                        {[
                                            selectedUser && "User",
                                            selectedWarehouse && "Warehouse",
                                            selectedLocation && "Location",
                                        ]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </>
                                )}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Show message if no results found */}
            {filteredSessions.length === 0 && sessions.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Tidak Ada Hasil
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Tidak ditemukan dokumen yang sesuai dengan kriteria
                            pencarian atau filter.
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Reset Semua Filter
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Actions bar */}
            {filteredSessions.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center space-x-2">
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {selectedSessions.size}
                            </span>{" "}
                            dari{" "}
                            <span className="font-medium text-foreground">
                                {filteredSessions.length}
                            </span>{" "}
                            dokumen dipilih
                            {hasActiveFilters && (
                                <div className="text-xs mt-1">
                                    (difilter data page ini dari{" "}
                                    {pagination?.totalCount || sessions.length}{" "}
                                    total dokumen)
                                </div>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={handleConfirmSessions}
                        disabled={selectedSessions.size === 0 || isConfirming}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isConfirming
                            ? "Mengkonfirmasi..."
                            : `Konfirmasi (${selectedSessions.size})`}
                    </Button>
                </div>
            )}

            {/* Sessions table */}
            {filteredSessions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Dokumen - Status Draft</CardTitle>
                        <CardDescription>
                            Dokumen yang dibuat oleh checker dan siap untuk
                            dikonfirmasi
                            {hasActiveFilters && (
                                <span className="ml-1">
                                    (Menampilkan {filteredSessions.length} dari{" "}
                                    {pagination?.totalCount || sessions.length}{" "}
                                    dokumen)
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Pilih semua dokumen"
                                            {...(someSelected && {
                                                "data-state": "indeterminate",
                                            })}
                                        />
                                    </TableHead>
                                    <TableHead>Dokumen</TableHead>
                                    <TableHead>Checker</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Total Qty</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedSessions.has(
                                                    session.id
                                                )}
                                                onCheckedChange={(checked) =>
                                                    handleSelectSession(
                                                        session.id,
                                                        checked
                                                    )
                                                }
                                                aria-label={`Pilih dokumen ${session.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {session.name}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <div>
                                                    <p className="font-medium">
                                                        {session.user?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {session.warehouse_name ? (
                                                <div className="flex items-center space-x-2">
                                                    <span>
                                                        {session.warehouse_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-center">
                                                <span className="font-medium">
                                                    {session.productCount}
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    items
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-center">
                                                <span className="font-medium">
                                                    {session.totalQuantity}
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    total
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(
                                                    new Date(
                                                        session.created_at
                                                    ),
                                                    "dd MMM yyyy",
                                                    { locale: id }
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {format(
                                                        new Date(
                                                            session.created_at
                                                        ),
                                                        "HH:mm"
                                                    )}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center space-x-1"
                                            >
                                                <span className="uppercase">
                                                    {session.state}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/user/session/${session.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Lihat Detail
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            {/* Sessions table */}
            {/* Pagination */}
            {pagination && (
                <PaginationControls
                    totalCount={pagination.totalCount}
                    pageSize={pagination.limit}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                />
            )}
        </div>
    );
};

export default SessionsTable;
