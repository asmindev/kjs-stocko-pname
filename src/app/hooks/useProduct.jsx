"use client";
import { useState, useCallback } from "react";

export const useProduct = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [product, setProduct] = useState(null);

    const searchProduct = useCallback(async (barcode) => {
        if (!barcode) {
            setError("Barcode is required");
            return null;
        }

        setLoading(true);
        setError(null);
        setProduct(null);

        try {
            const response = await fetch(
                `/api/product/search?barcode=${encodeURIComponent(barcode)}`
            );
            const data = await response.json();

            if (response.ok && data.product) {
                setProduct(data.product);
                return data.product;
            } else {
                setError(data.message || "Product not found");
                return null;
            }
        } catch (err) {
            const errorMessage = "Failed to search product";
            setError(errorMessage);
            console.error("Product search error:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearProduct = useCallback(() => {
        setProduct(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        product,
        loading,
        error,
        searchProduct,
        clearProduct,
        clearError,
    };
};

export default useProduct;
