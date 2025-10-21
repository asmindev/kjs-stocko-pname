/**
 * Constants untuk ProductTableForm
 */

// Form field names
export const FORM_FIELDS = {
    PRODUCTS: "products",
    BARCODE: "barcode",
    NAME: "name",
    UOM_ID: "uom_id",
    QUANTITY: "quantity",
};

// Validation messages
export const VALIDATION_MESSAGES = {
    BARCODE_REQUIRED: "Barcode wajib diisi",
    BARCODE_INVALID: "Format barcode tidak valid",
    BARCODE_DUPLICATE: "Barcode sudah ada di baris lain",
    QUANTITY_REQUIRED: "Quantity wajib diisi",
    QUANTITY_MIN: "Quantity minimal 0.1",
    QUANTITY_INVALID: "Quantity harus berupa angka",
    QUANTITY_INTEGER: "Quantity harus berupa bilangan bulat",
    PRODUCTS_MIN: "Minimal harus ada 1 produk",
    UOM_REQUIRED: "Unit of Measure wajib dipilih",
};

// Search and debounce settings
export const SEARCH_SETTINGS = {
    DEBOUNCE_DELAY: 500, // milliseconds
    MAX_RETRIES: 3,
    TIMEOUT: 10000, // 10 seconds
};

// UI settings
export const UI_SETTINGS = {
    MAX_ROWS_DISPLAY: 100,
    MIN_BARCODE_WIDTH: 160,
    MIN_NAME_WIDTH: 180,
    MIN_UOM_WIDTH: 80,
    MIN_QUANTITY_WIDTH: 60,
};

// Toast settings
export const TOAST_SETTINGS = {
    SUCCESS_DURATION: 4000,
    ERROR_DURATION: 6000,
    WARNING_DURATION: 5000,
};

// API endpoints
export const API_ENDPOINTS = {
    SCAN: "/api/scan",
    PRODUCT_SEARCH: "/api/product/search",
};

// Form validation rules
export const VALIDATION_RULES = {
    BARCODE: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 50,
        PATTERN: /^[a-zA-Z0-9\-_\.]+$/,
    },
    QUANTITY: {
        MIN: 0.1,
        MAX: 999999,
    },
    NAME: {
        MAX_LENGTH: 255,
    },
};

// Default values
export const DEFAULT_VALUES = {
    PRODUCT_ITEM: {
        barcode: "",
        name: "",
        uom_id: "",
        quantity: 1,
    },
    FORM: {
        products: [
            {
                barcode: "",
                name: "",
                uom_id: "",
                quantity: 1,
            },
        ],
    },
};

// Status constants
export const SEARCH_STATUS = {
    IDLE: "idle",
    SEARCHING: "searching",
    SUCCESS: "success",
    ERROR: "error",
    NOT_FOUND: "not_found",
};

// UoM constants
export const UOM_STATUS = {
    DISABLED: "disabled",
    SINGLE_OPTION: "single_option",
    MULTIPLE_OPTIONS: "multiple_options",
    NOT_AVAILABLE: "not_available",
};

// Button variants and sizes
export const BUTTON_CONFIG = {
    SCAN: {
        variant: "outline",
        size: "sm",
        className: "h-8 w-8 p-0 shrink-0",
    },
    REMOVE: {
        variant: "outline",
        size: "sm",
        className: "text-red-500 hover:text-red-700 h-8 w-8 p-0 shrink-0",
    },
    ADD: {
        variant: "outline",
        className: "flex items-center gap-2 w-full sm:w-auto",
    },
    SUBMIT: {
        className: "flex items-center gap-2 flex-1",
    },
    RESET: {
        variant: "outline",
        className: "w-full sm:w-auto",
    },
};

// Input configurations
export const INPUT_CONFIG = {
    BARCODE: {
        placeholder: "Scan/masukkan barcode",
        className:
            "w-full text-sm border-none border-b-2 outline-none focus:ring-0 shadow-none focus:outline-none focus:border-none",
    },
    NAME: {
        placeholder: "Nama produk",
        className: "w-full text-sm",
        readOnly: true, // Usually filled automatically from search
    },
    QUANTITY: {
        type: "number",
        min: "0.1",
        step: "0.01",
        placeholder: "1.00",
        className: "w-full text-sm text-center",
    },
};

// Select configurations
export const SELECT_CONFIG = {
    UOM: {
        placeholder: "UoM",
        className: "w-full h-9 text-sm",
        emptyMessage: "Scan produk dulu",
    },
};

// Error classes
export const ERROR_CLASSES = {
    INPUT: "border-red-500",
    TEXT: "text-red-500 text-xs",
};

// Success classes
export const SUCCESS_CLASSES = {
    TEXT: "text-green-500 text-xs",
};

// Loading classes
export const LOADING_CLASSES = {
    TEXT: "text-blue-500 text-xs",
};
