/**
 * Utilities untuk handling Unit of Measure (UoM)
 */

/**
 * Mengambil options UoM untuk sebuah produk
 * @param {Object} product - Data produk dari Odoo
 * @returns {Array} Array of UoM options dengan format {id, name}
 */
export const getUomOptions = (product) => {
    if (!product || !product.uom_id || !product.uom_po_id) {
        return [];
    }

    const uomId = product.uom_id[0];
    const uomName = product.uom_id[1];
    const uomPoId = product.uom_po_id[0];
    const uomPoName = product.uom_po_id[1];

    if (uomId === uomPoId) {
        // Same UoM, return single option
        return [{ id: uomId, name: uomName }];
    } else {
        // Different UoMs, return both options
        return [
            { id: uomId, name: uomName },
            { id: uomPoId, name: uomPoName },
        ];
    }
};

/**
 * Mengecek apakah UoM select harus disabled
 * @param {Object} product - Data produk dari Odoo
 * @returns {boolean} True jika select harus disabled
 */
export const isUomDisabled = (product) => {
    if (!product || !product.uom_id || !product.uom_po_id) {
        return true;
    }
    return product.uom_id[0] === product.uom_po_id[0];
};

/**
 * Mendapatkan default UoM ID untuk produk
 * @param {Object} product - Data produk dari Odoo
 * @returns {string} UoM ID sebagai string
 */
export const getDefaultUomId = (product) => {
    if (!product || !product.uom_id) {
        return "";
    }
    return product.uom_id[0].toString();
};

/**
 * Validasi apakah UoM ID valid untuk produk tertentu
 * @param {string} uomId - UoM ID yang akan divalidasi
 * @param {Object} product - Data produk dari Odoo
 * @returns {boolean} True jika UoM ID valid
 */
export const isValidUomForProduct = (uomId, product) => {
    if (!product || !uomId) {
        return false;
    }

    const validUomIds = getUomOptions(product).map((uom) => uom.id.toString());
    return validUomIds.includes(uomId.toString());
};

/**
 * Mendapatkan nama UoM berdasarkan ID
 * @param {string} uomId - UoM ID
 * @param {Object} product - Data produk dari Odoo
 * @returns {string} Nama UoM atau empty string jika tidak ditemukan
 */
export const getUomNameById = (uomId, product) => {
    if (!product || !uomId) {
        return "";
    }

    const uomOptions = getUomOptions(product);
    const foundUom = uomOptions.find(
        (uom) => uom.id.toString() === uomId.toString()
    );
    return foundUom ? foundUom.name : "";
};
