/**
 * Verification helpers - Pure utility functions
 * No React dependencies
 */

/**
 * Get location display name by ID
 * @param {number} id - Location ID
 * @param {Array} locations - Array of location objects
 * @returns {string} Location display name or fallback
 */
export function getLocationName(id, locations) {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.display_name : "Lokasi Tidak Diketahui";
}

/**
 * Get verifier name by ID
 * @param {string|number} id - Verifier ID
 * @param {Array} users - Array of user objects
 * @returns {string} Verifier name or fallback
 */
export function getVerifierName(id, users) {
    const user = users.find((u) => String(u.id) === String(id));
    return user ? user.name : "Tidak Diketahui";
}

/**
 * Calculate total quantities from entries and scans
 * @param {Array} entries - Verification entries
 * @param {Array} scans - Previous scan records
 * @returns {Object} Object with verified and scanned totals
 */
export function calculateTotals(entries = [], scans = []) {
    const totalVerified = entries.reduce(
        (sum, e) => sum + (e.product_qty || 0),
        0
    );
    const totalScanned = scans.reduce((sum, s) => sum + (s.quantity || 0), 0);

    return {
        verified: totalVerified,
        scanned: totalScanned,
    };
}

/**
 * Format location display name - extract last segment
 * @param {string} displayName - Full location display name
 * @returns {string} Last segment of location name
 */
export function formatLocationDisplay(displayName) {
    if (!displayName) return "";
    return displayName.split("/").pop();
}

/**
 * Filter scans by location IDs
 * @param {Array} scans - All scan records
 * @param {Array} locationIds - Array of valid location IDs
 * @returns {Array} Filtered scans
 */
export function filterScansByLocation(scans = [], locationIds = []) {
    return scans.filter((scan) => locationIds.includes(scan.location_id));
}
