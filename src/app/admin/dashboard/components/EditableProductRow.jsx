"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import Link from "next/link";
import LocationSelect from "@/app/user/scan/components/LocationSelect";

export default function EditableProductRow({ 
    product, 
    onUpdate, 
    inventoryLocations = [],
    isAdmin = false 
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({
        quantity: product.quantity,
        barcode: product.barcode,
        location_id: product.location_id,
        location_name: product.location_name,
    });

    const handleEdit = () => {
        setEditData({
            quantity: product.quantity,
            barcode: product.barcode,
            location_id: product.location_id,
            location_name: product.location_name,
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(product.id, editData);
            setIsEditing(false);
        } catch (error) {
            // Error handling is managed by parent (optimistic revert + toast)
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <tr className={`border-b transition-colors ${isEditing ? "bg-muted/30" : ""}`}>
            <td className="p-2">
                <div className="font-medium">{product.name}</div>
            </td>
            <td className="p-2 font-mono text-sm">
                {isEditing ? (
                    <Input
                        value={editData.barcode}
                        onChange={(e) => setEditData({ ...editData, barcode: e.target.value })}
                        className="h-8 text-sm font-mono w-full min-w-[120px]"
                    />
                ) : (
                    product.barcode
                )}
            </td>
            <td className="p-2">
                {isEditing ? (
                    <Input
                        type="number"
                        value={isNaN(editData.quantity) ? "" : editData.quantity}
                        onChange={(e) => {
                            const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                            setEditData({ ...editData, quantity: val });
                        }}
                        className="h-8 text-sm w-20"
                        step="0.01"
                    />
                ) : (
                    product.quantity
                )}
            </td>
            <td className="p-2">{product.uom_name || "—"}</td>
            <td className="p-2">
                {isEditing ? (
                    <div className="min-w-[150px]">
                        <LocationSelect
                            value={editData.location_id?.toString() || ""}
                            onValueChange={(loc) => setEditData({ 
                                ...editData, 
                                location_id: loc.location_id, 
                                location_name: loc.location_name 
                            })}
                            inventoryLocations={inventoryLocations}
                            selectedWarehouse={product.session?.warehouse_id || product.warehouse_id}
                        />
                    </div>
                ) : (
                    <div className="text-sm">
                        {product.location_name
                            ?.split("/")
                            .slice(-2)
                            .join("/") || "—"}
                    </div>
                )}
            </td>
            <td className="p-2">
                <div className="text-sm">
                    {product.session?.user?.name || product.User?.name || "—"}
                </div>
            </td>
            <td className="p-2">
                <Badge
                    variant={
                        product.state === "CONFIRMED"
                            ? "default"
                            : "secondary"
                    }
                >
                    {product.state}
                </Badge>
            </td>
            <td className="p-2">
                <div className="flex items-center">
                    {product.session ? (
                        <Link
                            href={`/admin/session/${product.session.id}`}
                            className="text-sm text-blue-600 hover:underline truncate max-w-[100px]"
                        >
                            {product.session.name}
                        </Link>
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                    )}
                </div>
            </td>
            <td className="p-2 text-center">
                <div className="flex justify-center gap-1">
                    {isAdmin && (
                        <>
                            {isEditing ? (
                                <>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleEdit}
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
