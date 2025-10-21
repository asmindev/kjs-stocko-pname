import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import useProduct from "@/app/hooks/useProduct";
import { getDefaultUom } from "../utils/uom.utils";

/**
 * Custom hook untuk menangani product search dan barcode handling
 * @param {Function} setValue - React Hook Form setValue function
 * @returns {Object} Object berisi state dan functions untuk product search
 */
export const useProductSearch = (setValue) => {
    const { searchProduct } = useProduct();
    const [searchingRows, setSearchingRows] = useState(new Set());
    const [productData, setProductData] = useState({}); // Store complete product data by row index
    const timeoutsRef = useRef(new Map());

    /**
     * Melakukan pencarian produk berdasarkan barcode
     * @param {string} barcode - Barcode yang akan dicari
     * @param {number} index - Index row dalam form
     */
    const performSearch = useCallback(
        async (barcode, index) => {
            barcode = barcode?.trim();
            console.log(
                `[performSearch] Called with barcode: "${barcode}", index: ${index}`
            );

            if (!barcode) {
                console.log(`[performSearch] Barcode is empty, returning`);
                return;
            }
            // if barcode length < 6, ignore
            if (barcode.length < 6) {
                console.log(
                    `[performSearch] Barcode too short (${barcode.length} chars), returning`
                );
                return;
            }

            // ✅ PERFORMANCE FIX: Check if product already cached
            if (productData[index]?.barcode === barcode) {
                console.log(
                    `⏭️  Product already cached for index ${index}, skipping API call`
                );
                return;
            }

            // Clear any existing timeout for this index
            if (timeoutsRef.current.has(index)) {
                clearTimeout(timeoutsRef.current.get(index));
            }

            // Execute search immediately without timeout
            console.log(
                `[performSearch] Starting search for barcode: ${barcode}`
            );
            setSearchingRows((prev) => new Set(prev).add(index));

            try {
                const foundProduct = await searchProduct(barcode);
                console.log(`[performSearch] Search result:`, foundProduct);

                if (foundProduct) {
                    // Store complete product data
                    setProductData((prev) => ({
                        ...prev,
                        [index]: foundProduct,
                    }));

                    // Set product ID from Odoo
                    if (foundProduct.id) {
                        setValue(
                            `products.${index}.product_id`,
                            foundProduct.id
                        );
                    }

                    // Set product barcode from database (actual barcode)
                    if (foundProduct.barcode) {
                        setValue(
                            `products.${index}.barcode`,
                            foundProduct.barcode
                        );
                    }

                    // Always set product name - use shouldValidate to ensure it triggers
                    setValue(
                        `products.${index}.name`,
                        foundProduct.name || "",
                        { shouldValidate: true, shouldDirty: true }
                    );

                    // Set default UoM
                    const { uom_id, uom_name } = getDefaultUom(foundProduct);

                    if (uom_id) {
                        setValue(`products.${index}.uom_id`, uom_id, {
                            shouldValidate: true,
                        });
                        setValue(`products.${index}.uom_name`, uom_name, {
                            shouldValidate: true,
                        });
                    }

                    toast.success(`Produk ditemukan!`, {
                        description: `${foundProduct.name} (${
                            foundProduct.barcode || barcode
                        })`,
                    });
                } else {
                    toast.error("Produk tidak ditemukan di Odoo", {
                        description: `Barcode: ${barcode}`,
                    });
                }
            } catch (error) {
                toast.error("Gagal mencari produk", {
                    description: `Barcode: ${barcode}`,
                });
                console.error("Search error:", error);
            } finally {
                setSearchingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });
            }
        },
        [searchProduct, setValue, productData]
    );

    /**
     * Menangani hasil scan barcode untuk row tertentu
     * @param {string} barcode - Barcode hasil scan
     * @param {number} targetIndex - Index row target
     */
    const handleScanResult = useCallback(
        (barcode, targetIndex) => {
            // Temporarily set the scanned barcode
            setValue(`products.${targetIndex}.barcode`, barcode);
            // Trigger search for this specific barcode - this will update the barcode field with the actual product barcode if found
            performSearch(barcode, targetIndex);
            toast.success("Barcode berhasil discan!", {
                description: `Baris ${targetIndex + 1}: ${barcode}`,
            });
        },
        [setValue, performSearch]
    );

    /**
     * Membersihkan data produk untuk row tertentu
     * @param {number} index - Index row yang akan dibersihkan
     */
    const clearProductData = useCallback((index) => {
        setProductData((prev) => {
            const newData = { ...prev };
            delete newData[index];
            return newData;
        });

        // Clear any pending timeout for this row
        if (timeoutsRef.current.has(index)) {
            clearTimeout(timeoutsRef.current.get(index));
            timeoutsRef.current.delete(index);
        }

        // Remove from searching rows
        setSearchingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    }, []);

    /**
     * Reset semua data search
     */
    const resetSearchData = useCallback(() => {
        setProductData({});
        setSearchingRows(new Set());

        // Clear all timeouts
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current.clear();
    }, []);

    /**
     * Mendapatkan data produk untuk row tertentu
     * @param {number} index - Index row
     * @returns {Object|null} Data produk atau null jika belum ada
     */
    const getProductData = useCallback(
        (index) => {
            return productData[index] || null;
        },
        [productData]
    );

    /**
     * Mengecek apakah row sedang dalam proses searching
     * @param {number} index - Index row
     * @returns {boolean} True jika sedang searching
     */
    const isRowSearching = useCallback(
        (index) => {
            return searchingRows.has(index);
        },
        [searchingRows]
    );

    /**
     * Trigger immediate search for a specific barcode and index
     * @param {string} barcode - Barcode to search
     * @param {number} index - Row index
     */
    const triggerImmediateSearch = useCallback(
        (barcode, index) => {
            // Perform search immediately
            performSearch(barcode, index);
        },
        [performSearch]
    );

    // Cleanup effect untuk timeouts
    const cleanup = useCallback(() => {
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current.clear();
    }, []);

    return {
        // States
        searchingRows,
        productData,

        // Functions
        performSearch,
        handleScanResult,
        clearProductData,
        resetSearchData,
        getProductData,
        isRowSearching,
        triggerImmediateSearch,
        setProductData, // Add this for external initialization
        cleanup,
    };
};
