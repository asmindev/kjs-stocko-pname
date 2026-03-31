"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Calendar, User, Edit, MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { confirmSession } from "./actions";
import { useSession } from "next-auth/react";
import Link from "next/link";

const STATE_MAP = {
    DRAFT: {
        label: "DRAFT",
        color: "bg-foreground",
    },
    CONFIRMED: {
        label: "CONFIRMED",
        color: "bg-blue-500",
    },
    POST: {
        label: "POST",
        color: "bg-green-500",
    },
    DONE: {
        label: "DONE",
        color: "bg-green-500",
    },
};

const DISABLE_ON_STATE = ["CONFIRMED", "POST", "DONE"];
export default function SessionDetail({ data }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = searchTerm
        ? data.products.filter(
              (p) =>
                  p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data.products;
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
        } catch (error) {
            return "Invalid Date";
        }
    };

    const onBack = () => {
        window.history.back();
    };

    const getStateBadgeVariant = (state) => {
        return STATE_MAP[state].color;
    };

    const handleEdit = () => {
        router.push(`/user/session/${data.id}/edit`);
    };

    const onConfirm = async () => {
        toast.promise(confirmSession(data.id), {
            loading: "Memproses dokumen...",
            success: "Dokumen berhasil dikonfirmasi!",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header dengan tombol kembali */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>
                <h1 className="text-2xl font-bold">Detail Dokumen</h1>
            </div>

            {/* Info Checker */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                {data.name || `Session #${data.id}`}
                            </div>
                            <div className="w-full gap-2 flex justify-end">
                                <Link href={`/user/session/${data.id}/edit`}>
                                    <Button
                                        variant="outline"
                                        className="hover:cursor-pointer"
                                        disabled={DISABLE_ON_STATE.includes(
                                            data.state
                                        )}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                                {/* CONFIRM BUTTON */}
                                <Button
                                    variant="default"
                                    className={`hover:cursor-pointer ${
                                        session?.user?.role !== "leader" &&
                                        "hidden"
                                    }`}
                                    disabled={DISABLE_ON_STATE.includes(
                                        data.state
                                    )}
                                    onClick={onConfirm}
                                >
                                    Konfirmasi
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                    <CardDescription>Informasi Detail Dokumen</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    Tanggal Dibuat
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(data.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">User</p>
                                <p className="text-sm text-muted-foreground">
                                    {data.user?.name || "Unknown User"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <Badge
                                    className={getStateBadgeVariant(data.state)}
                                >
                                    {data.state}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Lokasi</p>
                                <Badge variant={"outline"}>
                                    {data.warehouse_name || "-"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daftar Produk */}
            <Card>
                <CardHeader>
                    <CardTitle>Produk yang Discan</CardTitle>
                    <CardDescription>
                        Total {filteredProducts.length} dari {data.products.length} produk dalam dokumen ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search Input */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Cari nama produk atau barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {filteredProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Belum ada produk yang discan dalam session ini
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead className="min-w-[300px]">
                                        Nama Produk
                                    </TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product, index) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <code className="px-2 py-1 bg-muted rounded text-sm">
                                                {product.barcode}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {product.name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {product.quantity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.uom_name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {product.location_name || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
