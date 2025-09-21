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
    const searchedBarcodesRef = useRef(new Set());
    const timeoutsRef = useRef(new Map());

    /**
     * Melakukan pencarian produk berdasarkan barcode
     * @param {string} barcode - Barcode yang akan dicari
     * @param {number} index - Index row dalam form
     */
    const performSearch = useCallback(
        async (barcode, index) => {
            const searchKey = `${index}-${barcode}`;

            // Skip if already searched
            if (searchedBarcodesRef.current.has(searchKey)) {
                return;
            }

            // Clear any existing timeout for this index
            if (timeoutsRef.current.has(index)) {
                clearTimeout(timeoutsRef.current.get(index));
            }

            const timeoutId = setTimeout(async () => {
                setSearchingRows((prev) => new Set(prev).add(index));
                searchedBarcodesRef.current.add(searchKey);

                try {
                    const foundProduct = await searchProduct(barcode);

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

                        // Set product name
                        setValue(
                            `products.${index}.name`,
                            foundProduct.name || ""
                        );

                        // Set default UoM
                        const { uom_id, uom_name } =
                            getDefaultUom(foundProduct);

                        if (uom_id) {
                            setValue(`products.${index}.uom_id`, uom_id);
                            setValue(`products.${index}.uom_name`, uom_name);
                        }

                        toast.success(`Produk ditemukan!`, {
                            description: `${foundProduct.name} (${barcode})`,
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
                    timeoutsRef.current.delete(index);
                }
            }, 500);

            timeoutsRef.current.set(index, timeoutId);
        },
        [searchProduct, setValue]
    );

    /**
     * Menangani hasil scan barcode untuk row tertentu
     * @param {string} barcode - Barcode hasil scan
     * @param {number} targetIndex - Index row target
     */
    const handleScanResult = useCallback(
        (barcode, targetIndex) => {
            // Clear previous search cache for this row
            const keysToRemove = Array.from(searchedBarcodesRef.current).filter(
                (key) => key.startsWith(`${targetIndex}-`)
            );
            keysToRemove.forEach((key) =>
                searchedBarcodesRef.current.delete(key)
            );

            setValue(`products.${targetIndex}.barcode`, barcode);
            // Trigger search for this specific barcode
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

        // Clear searched cache for this row
        const keysToRemove = Array.from(searchedBarcodesRef.current).filter(
            (key) => key.startsWith(`${index}-`)
        );
        keysToRemove.forEach((key) => searchedBarcodesRef.current.delete(key));
    }, []);

    /**
     * Reset semua data search
     */
    const resetSearchData = useCallback(() => {
        setProductData({});
        setSearchingRows(new Set());
        searchedBarcodesRef.current.clear();

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
     * Clear search cache untuk row dan barcode tertentu
     * @param {number} index - Index row
     * @param {string} oldBarcode - Barcode lama yang akan di-clear dari cache
     */
    const clearSearchCache = useCallback((index, oldBarcode = null) => {
        if (oldBarcode) {
            // Clear specific barcode cache
            const searchKey = `${index}-${oldBarcode}`;
            searchedBarcodesRef.current.delete(searchKey);
        } else {
            // Clear all cache for this row
            const keysToRemove = Array.from(searchedBarcodesRef.current).filter(
                (key) => key.startsWith(`${index}-`)
            );
            keysToRemove.forEach((key) =>
                searchedBarcodesRef.current.delete(key)
            );
        }
    }, []);

    /**
     * Trigger immediate search for a specific barcode and index
     * @param {string} barcode - Barcode to search
     * @param {number} index - Row index
     */
    const triggerImmediateSearch = useCallback(
        (barcode, index) => {
            // Clear any previous search cache for this row
            clearSearchCache(index);
            // Perform search immediately
            performSearch(barcode, index);
        },
        [clearSearchCache, performSearch]
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
        clearSearchCache,
        triggerImmediateSearch,
        cleanup,
    };
};
