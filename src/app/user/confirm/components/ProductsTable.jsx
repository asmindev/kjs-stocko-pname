"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Package,
    Search,
    Filter,
    X,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/ui/pagination-controls";

const ProductsTable = ({ products, pagination, filters, onRefresh }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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

    const handleSearch = () => {
        if (searchTerm !== (searchParams.get("search") || "")) {
            updateUrl("search", searchTerm);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const uniqueUsers = filters?.users || [];
    const uniqueWarehouses = filters?.warehouses || [];
    const uniqueLocations = filters?.locations || [];

    const filteredProducts = products;

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setSelectedUser("");
        setSelectedWarehouse("");
        setSelectedLocation("");
        
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        params.delete("user");
        params.delete("warehouse");
        params.delete("location");
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    const hasActiveFilters =
        searchTerm || selectedUser || selectedWarehouse || selectedLocation;

    if (products.length === 0 && !hasActiveFilters) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Tidak Ada Produk
                    </h3>
                    <p className="text-muted-foreground text-center">
                        Belum ada produk dalam status draft.
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
                        Cari dan filter produk berdasarkan kriteria tertentu
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Pencarian Global
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari berdasarkan nama produk, barcode, checker, warehouse, atau lokasi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
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
                                        {selectedUser ? selectedUser : "Pilih user..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari user..." />
                                        <CommandList>
                                            <CommandEmpty>User tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedUser("");
                                                        updateUrl("user", "");
                                                        setOpenUser(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedUser === "" ? "opacity-100" : "opacity-0")} />
                                                    Semua User
                                                </CommandItem>
                                                {uniqueUsers.map((user) => (
                                                    <CommandItem
                                                        key={user}
                                                        value={user}
                                                        onSelect={(currentValue) => {
                                                            const newValue = currentValue === selectedUser ? "" : currentValue;
                                                            setSelectedUser(newValue);
                                                            updateUrl("user", newValue);
                                                            setOpenUser(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedUser === user ? "opacity-100" : "opacity-0")} />
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
                            <Popover open={openWarehouse} onOpenChange={setOpenWarehouse}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openWarehouse}
                                        className="w-full justify-between"
                                    >
                                        {selectedWarehouse ? selectedWarehouse : "Pilih warehouse..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari warehouse..." />
                                        <CommandList>
                                            <CommandEmpty>Warehouse tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedWarehouse("");
                                                        updateUrl("warehouse", "");
                                                        setOpenWarehouse(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedWarehouse === "" ? "opacity-100" : "opacity-0")} />
                                                    Semua Warehouse
                                                </CommandItem>
                                                {uniqueWarehouses.map((warehouse) => (
                                                    <CommandItem
                                                        key={warehouse}
                                                        value={warehouse}
                                                        onSelect={(currentValue) => {
                                                            const newValue = currentValue === selectedWarehouse ? "" : currentValue;
                                                            setSelectedWarehouse(newValue);
                                                            updateUrl("warehouse", newValue);
                                                            setOpenWarehouse(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedWarehouse === warehouse ? "opacity-100" : "opacity-0")} />
                                                        {warehouse}
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
                                Lokasi Produk
                            </label>
                            <Popover open={openLocation} onOpenChange={setOpenLocation}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openLocation}
                                        className="w-full justify-between"
                                    >
                                        {selectedLocation ? selectedLocation : "Pilih lokasi..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari lokasi..." />
                                        <CommandList>
                                            <CommandEmpty>Lokasi tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value=""
                                                    onSelect={() => {
                                                        setSelectedLocation("");
                                                        updateUrl("location", "");
                                                        setOpenLocation(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedLocation === "" ? "opacity-100" : "opacity-0")} />
                                                    Semua Lokasi
                                                </CommandItem>
                                                {uniqueLocations.map((location) => (
                                                    <CommandItem
                                                        key={location}
                                                        value={location}
                                                        onSelect={(currentValue) => {
                                                            const newValue = currentValue === selectedLocation ? "" : currentValue;
                                                            setSelectedLocation(newValue);
                                                            updateUrl("location", newValue);
                                                            setOpenLocation(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedLocation === location ? "opacity-100" : "opacity-0")} />
                                                        {location}
                                                    </CommandItem>
                                                ))}
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

                    {hasActiveFilters && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                <span>
                                    Menampilkan {filteredProducts.length} dari{" "}
                                    {pagination?.totalCount || products.length}{" "}
                                    produk
                                </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {hasActiveFilters && (
                                    <>
                                        {searchTerm && "Search"}
                                        {searchTerm && (selectedUser || selectedWarehouse || selectedLocation) && " + "}
                                        {[selectedUser && "User", selectedWarehouse && "Warehouse", selectedLocation && "Location"].filter(Boolean).join(", ")}
                                    </>
                                )}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {filteredProducts.length === 0 && products.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Tidak Ada Hasil</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Tidak ditemukan produk yang sesuai dengan kriteria pencarian atau filter.
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Reset Semua Filter
                        </Button>
                    </CardContent>
                </Card>
            )}

            {filteredProducts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Produk - Status Draft</CardTitle>
                        <CardDescription>
                            Produk dalam dokumen yang siap untuk dikonfirmasi
                            {hasActiveFilters && (
                                <span className="ml-1">
                                    (Menampilkan {filteredProducts.length} dari {pagination?.totalCount} produk)
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>Nama Produk</TableHead>
                                    <TableHead>PIC</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Session</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product, index) => {
                                    const globalIndex = pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1;
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>{globalIndex}</TableCell>
                                            <TableCell>
                                                <div className="font-mono text-sm max-w-[150px] truncate" title={product.barcode || "-"}>
                                                    {product.barcode || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="font-medium truncate" title={product.name}>
                                                    {product.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {product.session?.user?.name || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {product.quantity}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {product.uom?.name || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {product.location_name?.split("/").slice(-2).join("/") || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {product.session ? (
                                                    <Link
                                                        href={`/user/session/${product.session.id}`}
                                                        className="text-blue-600 hover:underline flex flex-col"
                                                    >
                                                        <span className="font-medium">{product.session.name}</span>
                                                        <span className="text-xs text-muted-foreground">{product.session.warehouse_name}</span>
                                                    </Link>
                                                ) : "-"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

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
        </div>
    );
};

export default ProductsTable;
