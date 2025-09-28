/**
 * Utility untuk konversi UOM ke reference unit
 */

/**
 * Konversi quantity ke reference unit berdasarkan UOM
 * @param {number} quantity - Jumlah yang akan dikonversi
 * @param {Object} uom - Object UOM dengan properties: uom_type, factor_inv, factor
 * @param {Object} referenceUom - UOM reference untuk kategori yang sama
 * @returns {number} - Quantity dalam reference unit
 */
export function convertToReference(quantity, uom, referenceUom) {
    if (!uom || !referenceUom) {
        return quantity; // fallback jika data tidak lengkap
    }

    // Jika sudah reference, return as is
    if (uom.uom_type === "reference") {
        return quantity;
    }

    // Jika bigger, bagi dengan factor_inv
    if (uom.uom_type === "bigger") {
        return quantity * (uom.factor_inv || 1);
    }

    // Jika smaller, kali dengan factor
    if (uom.uom_type === "smaller") {
        return quantity / (uom.factor || 1);
    }

    return quantity;
}

/**
 * Konversi quantity dari reference unit ke UOM target
 * @param {number} quantity - Jumlah dalam reference unit
 * @param {Object} targetUom - UOM target
 * @returns {number} - Quantity dalam target UOM
 */
export function convertFromReference(quantity, targetUom) {
    if (!targetUom) {
        return quantity;
    }

    // Jika target adalah reference, return as is
    if (targetUom.uom_type === "reference") {
        return quantity;
    }

    // Jika target bigger, bagi dengan factor_inv
    if (targetUom.uom_type === "bigger") {
        return quantity / (targetUom.factor_inv || 1);
    }

    // Jika target smaller, kali dengan factor
    if (targetUom.uom_type === "smaller") {
        return quantity * (targetUom.factor || 1);
    }

    return quantity;
}

/**
 * Cari UOM reference untuk kategori tertentu
 * @param {Array} uoms - Array UOM dalam kategori yang sama
 * @returns {Object|null} - UOM reference atau null jika tidak ditemukan
 */
export function findReferenceUom(uoms) {
    return uoms.find((uom) => uom.uom_type === "reference") || null;
}

/**
 * Cari UOM dengan tipe "smaller" dari array UOM
 * @param {Array} uoms - Array UOM dalam kategori yang sama
 * @returns {Object|null} - UOM dengan tipe smaller atau null jika tidak ditemukan
 */
export function findSmallerUom(uoms) {
    return uoms.find((uom) => uom.uom_type === "smaller") || null;
}

/**
 * Konversi quantity langsung antara dua UOM tanpa perlu reference
 * @param {number} quantity - Jumlah yang akan dikonversi
 * @param {Object} fromUom - UOM asal
 * @param {Object} targetUom - UOM target
 * @returns {number} - Quantity dalam target UOM
 */
export function convertDirectly(quantity, fromUom, targetUom) {
    if (!fromUom || !targetUom) {
        return quantity;
    }

    // Jika UOM asal sama dengan target, return as is
    if (fromUom.id === targetUom.id) {
        return quantity;
    }

    // Jika kedua UOM dalam kategori yang sama, lakukan konversi langsung
    if (fromUom.category_id === targetUom.category_id) {
        // Konversi dari UOM ke base unit (reference equivalent)
        let baseQuantity = quantity;

        // Convert from source UOM to base
        if (fromUom.uom_type === "bigger") {
            baseQuantity = quantity * (fromUom.factor_inv || 1);
        } else if (fromUom.uom_type === "smaller") {
            baseQuantity = quantity / (fromUom.factor || 1);
        }
        // reference stays as is

        // Convert from base to target UOM
        if (targetUom.uom_type === "bigger") {
            return baseQuantity / (targetUom.factor_inv || 1);
        } else if (targetUom.uom_type === "smaller") {
            return baseQuantity * (targetUom.factor || 1);
        }
        // reference stays as is
        return baseQuantity;
    }

    // Fallback jika kategori berbeda
    return quantity;
}

/**
 * Konversi quantity ke UOM target (dengan fallback ke reference method jika diperlukan)
 * @param {number} quantity - Jumlah yang akan dikonversi
 * @param {Object} fromUom - UOM asal
 * @param {Object} targetUom - UOM target
 * @param {Object} referenceUom - UOM reference untuk kategori (optional, untuk fallback)
 * @returns {number} - Quantity dalam target UOM
 */
export function convertToTargetUom(
    quantity,
    fromUom,
    targetUom,
    referenceUom = null
) {
    if (!fromUom || !targetUom) {
        return quantity;
    }

    // Jika UOM asal sama dengan target, return as is
    if (fromUom.id === targetUom.id) {
        return quantity;
    }

    // Coba konversi langsung dulu
    if (fromUom.category_id === targetUom.category_id) {
        return convertDirectly(quantity, fromUom, targetUom);
    }

    // Fallback ke method lama jika reference UOM tersedia
    if (referenceUom) {
        const quantityInReference = convertToReference(
            quantity,
            fromUom,
            referenceUom
        );
        return convertFromReference(quantityInReference, targetUom);
    }

    return quantity;
}

/**
 * Group UOM berdasarkan kategori dan cari reference serta smaller untuk setiap kategori
 * @param {Array} allUoms - Semua UOM dari database
 * @returns {Map} - Map dengan key category_id dan value { uoms, reference, smaller }
 */
export function groupUomsByCategory(allUoms) {
    const categoryMap = new Map();

    for (const uom of allUoms) {
        if (!categoryMap.has(uom.category_id)) {
            categoryMap.set(uom.category_id, {
                uoms: [],
                reference: null,
                smaller: null,
            });
        }

        const category = categoryMap.get(uom.category_id);
        category.uoms.push(uom);

        // Set reference jika ditemukan
        if (uom.uom_type === "reference") {
            category.reference = uom;
        }

        // Set smaller jika ditemukan
        if (uom.uom_type === "smaller") {
            category.smaller = uom;
        }
    }

    return categoryMap;
}
