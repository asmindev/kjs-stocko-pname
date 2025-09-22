import { z } from "zod";

// Schema untuk tabel produk
export const productTableSchema = z.object({
    products: z
        .array(
            z.object({
                barcode: z.string().min(1, "Barcode wajib diisi").trim(),
                name: z
                    .string()
                    .optional()
                    .transform((val) => val?.trim() || ""),
                uom_id: z.string().optional().default(""),
                uom_name: z.string().refine((val) => val && val.trim() !== "", {
                    message: "UoM tidak valid",
                }),
                product_id: z.number().optional(), // ID dari Odoo (optional untuk backward compatibility)
                location_id: z
                    .union([z.number(), z.string(), z.null()])
                    .transform((val) => {
                        if (val === null || val === undefined || val === "")
                            return null;
                        return typeof val === "string" ? parseInt(val) : val;
                    })
                    .refine((val) => val !== null && val !== undefined, {
                        message: "Lokasi produk wajib dipilih",
                    }), // ID lokasi inventori (required)
                location_name: z.string().default(""), // Nama lokasi inventori
                quantity: z
                    .number({
                        required_error: "Quantity wajib diisi",
                        invalid_type_error: "Quantity harus berupa angka",
                    })
                    .min(1, "Quantity minimal 1")
                    .int("Quantity harus berupa bilangan bulat"),
            })
        )
        .min(1, "Minimal harus ada 1 produk"),
});

// Default values untuk form
export const defaultProductItem = {
    barcode: "",
    name: "",
    uom_id: "",
    uom_name: "",
    product_id: null, // ID dari Odoo akan diisi otomatis
    quantity: null,
    location_id: null, // ID lokasi inventori, akan diisi otomatis
    location_name: "", // Nama lokasi inventori, akan diisi otomatis
};

export const defaultProductTableValues = {
    products: [defaultProductItem],
};
