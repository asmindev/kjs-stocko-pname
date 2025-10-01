// get unposted documents with `state` CONFIRMED
"use server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth";
import {
    convertToReference,
    convertToTargetUom,
    convertDirectly,
    groupUomsByCategory,
    findReferenceUom,
    findSmallerUom,
} from "@/lib/uomConverter";
import { parse } from "date-fns/parse";
import { revalidatePath } from "next/cache";

export const getUnpostedProducts = async () => {
    const session = await getServerSession(authOptions);
    await OdooSessionManager.getClient(session.user.id, session.user.email);

    // get all products with `state` CONFIRMED
    const products = await prisma.product.findMany({
        where: {
            state: "CONFIRMED",
        },
        include: {
            session: {
                include: {
                    user: true,
                },
            },
            uom: {
                include: {
                    category: true,
                },
            },
        },
    });

    // Get all UOMs untuk konversi
    const allUoms = await prisma.uom.findMany({
        include: {
            category: true,
        },
    });

    // Group UOMs by category untuk konversi
    const uomCategoryMap = groupUomsByCategory(allUoms);

    // Pertama, group products untuk menentukan target UOM per produk
    const warehouseMap = new Map();
    const productUomMap = new Map(); // Track UOM per produk untuk menentukan target UOM

    // First pass: collect all UOMs per product to determine target UOM
    for (const p of products) {
        const warehouseId = p.session?.warehouse_id ?? 0;
        // Hilangkan location dari key agar produk yang sama digabung
        const productKey = `${
            p.product_id ?? p.barcode ?? p.name ?? "UNKNOWN"
        }`;

        const fullKey = `${warehouseId}-${productKey}`;

        if (!productUomMap.has(fullKey)) {
            productUomMap.set(fullKey, {
                uoms: new Set(),
                categoryId: p.uom?.category_id,
            });
        }

        if (p.uom) {
            productUomMap.get(fullKey).uoms.add(p.uom);
        }
    }

    // Determine target UOM for each product
    const productTargetUomMap = new Map();
    for (const [fullKey, productInfo] of productUomMap.entries()) {
        let targetUom = null;
        let needsConversion = false;
        const uomsInProduct = Array.from(productInfo.uoms);

        if (uomsInProduct.length === 1) {
            // Jika hanya ada 1 UOM dalam produk, tidak perlu konversi
            targetUom = uomsInProduct[0];
            needsConversion = false;
        } else if (uomsInProduct.length > 1 && productInfo.categoryId) {
            // Jika ada multiple UOM, check jika semua UOM sama
            if (uomsInProduct.every((uom) => uom.id === uomsInProduct[0].id)) {
                targetUom = uomsInProduct[0];
                needsConversion = false;
            } else {
                // Cari smaller UOM dari UOM yang ada di produk ini
                const smallerUomInProduct = uomsInProduct.find(
                    (uom) =>
                        uom.uom_type === "smaller" ||
                        uom.uom_type === "reference"
                );
                // Gunakan smaller UOM yang ada di produk
                targetUom = smallerUomInProduct;
                needsConversion = true;
            }
        }

        productTargetUomMap.set(fullKey, {
            targetUom,
            needsConversion,
        });
    }

    // Second pass: group products dengan konversi ke target UOM
    for (const p of products) {
        const warehouseId = p.session?.warehouse_id ?? 0;
        const warehouseName = p.session?.warehouse_name || "-";
        const key = String(warehouseId);

        if (!warehouseMap.has(key)) {
            warehouseMap.set(key, {
                warehouse_id: warehouseId,
                warehouse_name: warehouseName,
                products: [],
            });
        }
        const warehouseEntry = warehouseMap.get(key);

        // Create unique key untuk product (tanpa location agar digabung)
        const productKey = `${
            p.product_id ?? p.barcode ?? p.name ?? "UNKNOWN"
        }`;

        const fullKey = `${warehouseId}-${productKey}`;

        let productEntry = warehouseEntry.products.find(
            (it) => it.key === productKey
        );
        if (!productEntry) {
            const targetInfo = productTargetUomMap.get(fullKey);

            productEntry = {
                key: productKey,
                name: p.name || p.barcode || `Produk ${productKey}`,
                warehouse_id: warehouseId,
                warehouse_name: warehouseName,
                quantity: 0, // akan diisi dengan konversi ke target UOM
                targetUom: targetInfo?.needsConversion
                    ? targetInfo.targetUom
                    : null, // Hanya set jika perlu konversi
                originalUom: null, // Akan diset ke UOM pertama yang ditemukan
                needsConversion: targetInfo?.needsConversion || false,
                data: [],
            };
            warehouseEntry.products.push(productEntry);
        }

        // Konversi quantity ke target UOM
        const originalQty = p.quantity || 0;
        let convertedQty = originalQty;
        const targetInfo = productTargetUomMap.get(fullKey);

        // Hanya lakukan konversi jika ada multiple UOM dalam produk
        if (targetInfo?.needsConversion && p.uom && targetInfo.targetUom) {
            // Konversi langsung ke target UOM tanpa perlu reference
            convertedQty = convertDirectly(
                originalQty,
                p.uom,
                targetInfo.targetUom
            );
        }

        // Set originalUom ke UOM pertama yang ditemukan, atau jika tidak ada konversi gunakan UOM saat ini
        if (!productEntry.originalUom && p.uom) {
            productEntry.originalUom = p.uom;
        } else if (!productEntry.needsConversion && p.uom) {
            // Jika tidak perlu konversi, pastikan menggunakan UOM yang sama
            productEntry.originalUom = p.uom;
        }

        productEntry.quantity += convertedQty;
        productEntry.data.push({
            session: {
                id: p.session?.id,
                name: p.session?.name,
            },
            user: p.session?.user
                ? { id: p.session.user.id, name: p.session.user.name }
                : undefined,
            created_at: p.created_at,
            quantity: originalQty, // quantity asli
            convertedQuantity: convertedQty, // quantity setelah konversi
            uom: p.uom
                ? {
                      id: p.uom.id,
                      name: p.uom.name,
                      type: p.uom.uom_type,
                  }
                : null,
            location: {
                id: p.location_id ?? null,
                name: p.location_name || "-",
            },
        });
    }

    const groupedProducts = Array.from(warehouseMap.values())
        .map((w) => ({
            ...w,
            products: w.products
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((prod) => ({
                    ...prod,
                    data: prod.data.sort(
                        (a, b) =>
                            new Date(b.created_at) - new Date(a.created_at)
                    ),
                })),
        }))
        .sort((a, b) =>
            String(a.warehouse_name).localeCompare(String(b.warehouse_name))
        );

    return { groupedProducts };
};

export const getProductDetails = async (warehouseId, productKey) => {
    const session = await getServerSession(authOptions);
    await OdooSessionManager.getClient(session.user.id, session.user.email);

    if (!session) {
        return {
            success: false,
            error: "Unauthorized. Please login first.",
        };
    }

    if (!warehouseId) {
        return {
            success: false,
            error: "Please select a warehouse first.",
        };
    }

    if (!productKey) {
        return {
            success: false,
            error: "Product key is required.",
        };
    }

    // Parse productKey untuk mendapatkan product identifier (tanpa location)
    const productIdentifier = productKey.split("-")[1];

    // Build OR conditions dengan type checking
    const orConditions = [];

    // Check jika productIdentifier adalah number untuk product_id
    const productIdAsNumber = parseInt(productIdentifier);
    if (!isNaN(productIdAsNumber)) {
        orConditions.push({ product_id: productIdAsNumber });
    }

    // Get products dengan filter yang tepat (semua lokasi untuk produk ini)
    const products = await prisma.product.findMany({
        where: {
            state: "CONFIRMED",
            product_id: parseInt(productIdentifier) || undefined,
            session: {
                warehouse_id: parseInt(warehouseId),
            },
            // Hilangkan location_id filter agar semua lokasi untuk produk ini diambil
        },
        include: {
            session: {
                include: {
                    user: true,
                },
            },
            uom: {
                include: {
                    category: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });

    if (products.length === 0) {
        return null;
    }

    // Get all UOMs untuk konversi
    const allUoms = await prisma.uom.findMany({
        include: {
            category: true,
        },
    });

    // Group UOMs by category untuk konversi
    const uomCategoryMap = groupUomsByCategory(allUoms);

    // Determine target UOM untuk produk ini
    let targetUom = null;
    let needsConversion = false;
    const uomsInProduct = [
        ...new Set(products.map((p) => p.uom).filter(Boolean)),
    ];

    if (uomsInProduct.length === 1) {
        // Jika hanya ada 1 UOM dalam produk, tidak perlu konversi
        targetUom = uomsInProduct[0];
        needsConversion = false;
    } else if (uomsInProduct.length > 1 && uomsInProduct[0].category_id) {
        // Jika ada multiple UOM, check jika uom uom tsb kemungkinan uom yang sama
        if (uomsInProduct.every((uom) => uom.id === uomsInProduct[0].id)) {
            targetUom = uomsInProduct[0];
            needsConversion = false;
        } else {
            // Cari smaller UOM dari UOM yang ada di produk ini
            const smallerUomInProduct = uomsInProduct.find(
                (uom) =>
                    uom.uom_type === "smaller" || uom.uom_type === "reference"
            );
            // Gunakan smaller UOM yang ada di produk
            targetUom = smallerUomInProduct;
            needsConversion = true;
        }
    }

    let totalQty = 0;
    const details = [];

    for (const p of products) {
        // Konversi quantity ke target UOM
        const originalQty = p.quantity || 0;
        let convertedQty = originalQty;

        // Hanya lakukan konversi jika ada multiple UOM dalam produk
        if (needsConversion && p.uom && targetUom) {
            // Konversi langsung ke target UOM tanpa perlu reference
            convertedQty = convertDirectly(originalQty, p.uom, targetUom);
        }

        totalQty += convertedQty;
        details.push({
            session: {
                id: p.session?.id,
                name: p.session?.name,
            },
            user: p.session?.user
                ? { id: p.session.user.id, name: p.session.user.name }
                : undefined,
            created_at: p.created_at,
            quantity: originalQty, // quantity asli
            convertedQuantity: convertedQty, // quantity setelah konversi
            uom: p.uom
                ? {
                      id: p.uom.id,
                      name: p.uom.name,
                      type: p.uom.uom_type,
                  }
                : null,
            location: {
                id: p.location_id ?? null,
                name: p.location_name || "-",
            },
        });
    }

    // Get warehouse info
    const firstProduct = products[0];
    const warehouseName =
        firstProduct.session?.warehouse_name || `Warehouse ${warehouseId}`;
    const productName =
        firstProduct.name ||
        firstProduct.barcode ||
        `Produk ${productIdentifier}`;

    return {
        product: productName,
        barcode: firstProduct.barcode || null,
        warehouse: warehouseName,
        warehouseId: parseInt(warehouseId),
        qty: totalQty,
        targetUom: needsConversion ? targetUom : null, // Hanya tampilkan jika ada konversi
        originalUom: uomsInProduct[0] || null, // UOM asli untuk ditampilkan
        needsConversion,
        details,
    };
};
