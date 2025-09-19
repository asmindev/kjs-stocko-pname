import { toast } from "sonner";

/**
 * Service untuk menangani API calls terkait product operations
 */

/**
 * Submit product data ke API
 * @param {Array} products - Array of product data
 * @param {number} userId - User ID (default: 1)
 * @returns {Promise<Object>} Result object dengan success count dan failed count
 */
export const submitProducts = async (products, userId = 1) => {
    const loadingToast = toast.loading("Menyimpan produk...");

    try {
        // Submit all products in one request as array
        const response = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                products: products.map((product) => ({
                    barcode: product.barcode,
                    name: product.name,
                    uom_id: product.uom_id,
                    quantity: product.quantity,
                })),
                userId: userId,
            }),
        });

        const result = await response.json();
        toast.dismiss(loadingToast);

        if (response.ok) {
            const successCount = result.successCount || products.length;
            const failedCount = result.failedCount || 0;

            toast.success(`${successCount} produk berhasil disimpan!`, {
                description:
                    failedCount > 0
                        ? `${failedCount} produk gagal disimpan`
                        : undefined,
            });

            return {
                success: true,
                successCount,
                failedCount,
                results: result.results || [],
                response: result,
            };
        } else {
            toast.error("Gagal menyimpan produk", {
                description: result.error || "Terjadi kesalahan pada server",
            });

            return {
                success: false,
                successCount: 0,
                failedCount: products.length,
                results: [],
                response: result,
            };
        }
    } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Terjadi kesalahan jaringan", {
            description: "Periksa koneksi internet Anda",
        });
        console.error("Submit error:", error);

        throw error;
    }
};

/**
 * Validate product data before submission
 * @param {Array} products - Array of product data
 * @returns {Object} Validation result
 */
export const validateProductsForSubmission = (products) => {
    const errors = [];
    const warnings = [];

    products.forEach((product, index) => {
        // Check required fields
        if (!product.barcode?.trim()) {
            errors.push(`Baris ${index + 1}: Barcode wajib diisi`);
        }

        if (!product.quantity || product.quantity < 1) {
            errors.push(`Baris ${index + 1}: Quantity harus minimal 1`);
        }

        // Check warnings
        if (!product.name?.trim()) {
            warnings.push(`Baris ${index + 1}: Nama produk kosong`);
        }

        if (!product.uom_id?.trim()) {
            warnings.push(`Baris ${index + 1}: UoM belum dipilih`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0,
    };
};

/**
 * Batch submit dengan error handling yang lebih robust
 * @param {Array} products - Array of product data
 * @param {Object} options - Submit options
 * @returns {Promise<Object>} Submit result
 */
export const batchSubmitProducts = async (products, options = {}) => {
    const {
        userId = 1,
        validateFirst = true,
        continueOnError = false,
        batchSize = 5, // Submit in batches to avoid overwhelming the server
    } = options;

    // Validate products first if requested
    if (validateFirst) {
        const validation = validateProductsForSubmission(products);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join(", ");
            toast.error("Validasi gagal", {
                description: errorMessage,
            });
            throw new Error(`Validation failed: ${errorMessage}`);
        }

        // Show warnings if any
        if (validation.hasWarnings) {
            const warningMessage = validation.warnings.join(", ");
            toast.warning("Peringatan", {
                description: warningMessage,
            });
        }
    }

    const loadingToast = toast.loading(
        `Menyimpan ${products.length} produk...`
    );
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    try {
        // Process in batches
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            const batchPromises = batch.map(async (product, batchIndex) => {
                const globalIndex = i + batchIndex;
                try {
                    const response = await fetch("/api/scan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            barcode: product.barcode,
                            name: product.name,
                            uom_id: product.uom_id,
                            quantity: product.quantity,
                            userId: userId,
                        }),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        successCount++;
                        return {
                            success: true,
                            index: globalIndex,
                            result,
                            product,
                        };
                    } else {
                        failedCount++;
                        return {
                            success: false,
                            index: globalIndex,
                            error: result.error || "Unknown error",
                            product,
                        };
                    }
                } catch (error) {
                    failedCount++;
                    return {
                        success: false,
                        index: globalIndex,
                        error: error.message,
                        product,
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Update loading toast with progress
            if (i + batchSize < products.length) {
                toast.dismiss(loadingToast);
                const progress = Math.round(
                    ((i + batchSize) / products.length) * 100
                );
                toast.loading(`Menyimpan produk... ${progress}%`);
            }

            // Stop if there are errors and continueOnError is false
            if (!continueOnError && failedCount > 0) {
                break;
            }
        }

        toast.dismiss(loadingToast);

        // Show final result
        if (successCount > 0) {
            toast.success(`${successCount} produk berhasil disimpan!`, {
                description:
                    failedCount > 0
                        ? `${failedCount} produk gagal disimpan`
                        : undefined,
            });
        } else {
            toast.error("Gagal menyimpan semua produk");
        }

        return {
            success: successCount > 0,
            successCount,
            failedCount,
            results,
            totalProcessed: products.length,
        };
    } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Terjadi kesalahan sistem", {
            description: error.message,
        });
        throw error;
    }
};
