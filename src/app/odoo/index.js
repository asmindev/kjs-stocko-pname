import { OdooClient } from "@tapni/odoo-xmlrpc";

class Client {
    /**
     * Initialize an Odoo client instance
     * @param {Object} params - Email and password for authentication
     * @param {string} params.email - Email for authentication
     * @param {string} params.password - Password for authentication
     */
    constructor({ email, password }) {
        console.log("Initializing Odoo client");
        this.email = email;
        this.password = password;
        const ODOO = {
            url: "http://localhost:8001",
            db: "kjsdev",
            username: email,
            password: password,
        };
        this.client = new OdooClient(ODOO);
    }

    async authenticate() {
        try {
            const auth = await this.client.authenticate();
            console.log("Authenticated user ID:", auth);
            return auth; // Return user ID on successful authentication
        } catch (error) {
            console.error("Error authenticating:", error);
            return false;
        }
    }

    async getUserInfo() {
        try {
            const userId = await this.client.authenticate();
            if (!userId) {
                throw new Error("Authentication failed");
            }

            // Get user info from res.users model
            const userInfo = await this.client.searchRead(
                "res.users",
                [["id", "=", userId]],
                {
                    fields: ["name", "email", "login"],
                    limit: 1,
                }
            );

            if (userInfo.length === 0) {
                throw new Error("User not found");
            }

            return {
                id: userId,
                name: userInfo[0].name,
                email: userInfo[0].email || userInfo[0].login,
            };
        } catch (error) {
            console.error("Error getting user info:", error);
            return null;
        }
    }

    async product(barcode) {
        try {
            const auth = await this.client.authenticate();
            console.log("Authenticated user ID:", auth);

            const domain = [["barcode", "=", barcode]];
            const options = {
                fields: ["id", "name", "barcode", "list_price", "uom_id"],
                limit: 1,
            };

            const product = await this.client.searchRead(
                "product.template",
                domain,
                options
            );

            if (product.length === 0) {
                throw new Error("Product not found");
            }
            console.log("Product:", product);
            return { product: product[0] };
        } catch (error) {
            console.error("Error fetching product:", error);
            return { error: error.message };
        }
    }

    async getWarehouses() {
        try {
            const auth = await this.client.authenticate();
            console.log("Authenticated user ID:", auth);

            const domain = [];
            const options = {
                fields: ["id", "name", "code", "lot_stock_id"],
            };

            const warehouses = await this.client.searchRead(
                "stock.warehouse",
                domain,
                options
            );
            return { warehouses };
        } catch (error) {
            console.error("Error fetching warehouses:", error);
            return { error: error.message };
        }
    }
    /**
     * Get inventory locations by stock location ID
     * @param {number} stock_location_id - Stock location ID
     * @returns {Promise<Object>} Object with locations or error message
     */
    async getInventoryLocations() {
        try {
            const auth = await this.client.authenticate();
            console.log("Authenticated user ID:", auth);
            let domain = [];
            const options = {
                fields: ["display_name", "id", "stock_location_id"],
            };

            const locations = await this.client.searchRead(
                "inventory.product.locations",
                domain,
                options
            );

            return { locations };
        } catch (error) {
            console.error("Error fetching inventory locations:", error);
            return { error: error.message };
        }
    }
}

export default Client;
