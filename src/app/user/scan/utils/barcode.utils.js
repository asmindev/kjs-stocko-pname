/**
 * Utilities untuk handling barcode operations
 */

/**
 * Validate barcode format
 * @param {string} barcode - Barcode string to validate
 * @returns {Object} Validation result
 */
export const validateBarcode = (barcode) => {
    if (!barcode || typeof barcode !== "string") {
        return {
            isValid: false,
            error: "Barcode tidak boleh kosong",
        };
    }

    const trimmedBarcode = barcode.trim();

    if (trimmedBarcode.length === 0) {
        return {
            isValid: false,
            error: "Barcode tidak boleh kosong",
        };
    }

    // Check minimum length (adjust as needed)
    if (trimmedBarcode.length < 3) {
        return {
            isValid: false,
            error: "Barcode terlalu pendek (minimal 3 karakter)",
        };
    }

    // Check maximum length (adjust as needed)
    if (trimmedBarcode.length > 50) {
        return {
            isValid: false,
            error: "Barcode terlalu panjang (maksimal 50 karakter)",
        };
    }

    // Check for valid characters (alphanumeric and some special chars)
    const validPattern = /^[a-zA-Z0-9\-_\.]+$/;
    if (!validPattern.test(trimmedBarcode)) {
        return {
            isValid: false,
            error: "Barcode hanya boleh mengandung huruf, angka, tanda strip, underscore, dan titik",
        };
    }

    return {
        isValid: true,
        error: null,
        normalizedBarcode: trimmedBarcode,
    };
};

/**
 * Normalize barcode untuk consistency
 * @param {string} barcode - Raw barcode
 * @returns {string} Normalized barcode
 */
export const normalizeBarcode = (barcode) => {
    if (!barcode) return "";

    // Remove leading/trailing whitespace and convert to uppercase
    return barcode.trim().toUpperCase();
};

/**
 * Check if barcode is duplicate in array
 * @param {string} barcode - Barcode to check
 * @param {Array} products - Array of products to check against
 * @param {number} currentIndex - Current index to exclude from check
 * @returns {boolean} True if duplicate found
 */
export const isDuplicateBarcode = (barcode, products, currentIndex) => {
    if (!barcode || !products) return false;

    const normalizedBarcode = normalizeBarcode(barcode);

    return products.some((product, index) => {
        if (index === currentIndex) return false;
        return normalizeBarcode(product.barcode) === normalizedBarcode;
    });
};

/**
 * Generate search key untuk caching
 * @param {string} barcode - Barcode
 * @param {number} index - Row index
 * @returns {string} Search key
 */
export const generateSearchKey = (barcode, index) => {
    return `${index}-${normalizeBarcode(barcode)}`;
};

/**
 * Check if barcode format matches specific patterns
 * @param {string} barcode - Barcode to check
 * @returns {Object} Pattern information
 */
export const detectBarcodeType = (barcode) => {
    if (!barcode) return { type: "unknown", confidence: 0 };

    const normalized = normalizeBarcode(barcode);

    // EAN-13 pattern (13 digits)
    if (/^\d{13}$/.test(normalized)) {
        return { type: "EAN-13", confidence: 1 };
    }

    // EAN-8 pattern (8 digits)
    if (/^\d{8}$/.test(normalized)) {
        return { type: "EAN-8", confidence: 1 };
    }

    // UPC-A pattern (12 digits)
    if (/^\d{12}$/.test(normalized)) {
        return { type: "UPC-A", confidence: 1 };
    }

    // Code 128 pattern (alphanumeric)
    if (/^[A-Z0-9\-\.]+$/.test(normalized) && normalized.length >= 6) {
        return { type: "Code 128", confidence: 0.8 };
    }

    // Custom/Internal barcode
    if (normalized.length >= 3) {
        return { type: "Custom", confidence: 0.5 };
    }

    return { type: "unknown", confidence: 0 };
};

/**
 * Format barcode untuk display
 * @param {string} barcode - Raw barcode
 * @param {Object} options - Formatting options
 * @returns {string} Formatted barcode
 */
export const formatBarcodeForDisplay = (barcode, options = {}) => {
    const { addSpaces = false, groupSize = 4, maxLength = 50 } = options;

    if (!barcode) return "";

    let formatted = normalizeBarcode(barcode);

    // Truncate if too long
    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength) + "...";
    }

    // Add spaces for readability
    if (addSpaces && formatted.length > groupSize) {
        formatted = formatted
            .replace(new RegExp(`(.{${groupSize}})`, "g"), "$1 ")
            .trim();
    }

    return formatted;
};
