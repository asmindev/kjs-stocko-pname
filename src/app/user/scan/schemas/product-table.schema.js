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
                uom_name: z.string().optional().default(""),
                product_id: z.number().optional(), // ID dari Odoo (optional untuk backward compatibility)
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

// Schema untuk single product item
export const productItemSchema = z.object({
    barcode: z.string().min(1, "Barcode wajib diisi").trim(),
    name: z
        .string()
        .optional()
        .transform((val) => val?.trim() || ""),
    uom_id: z.number(),
    quantity: z
        .number({
            required_error: "Quantity wajib diisi",
            invalid_type_error: "Quantity harus berupa angka",
        })
        .min(1, "Quantity minimal 1")
        .int("Quantity harus berupa bilangan bulat"),
    uom_name: z.string({
        required_error: "UoM name wajib diisi",
        invalid_type_error: "UoM name harus berupa string",
    }),
    product_id: z.number({
        required_error: "Product ID wajib diisi",
        invalid_type_error: "Product ID harus berupa angka",
    }),
});

// Default values untuk form
export const defaultProductItem = {
    barcode: "",
    name: "",
    uom_id: "",
    uom_name: "",
    product_id: null, // ID dari Odoo akan diisi otomatis
    quantity: 1,
};

export const defaultProductTableValues = {
    products: [defaultProductItem],
};
