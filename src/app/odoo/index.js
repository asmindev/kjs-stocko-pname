import { OdooClient } from "@tapni/odoo-xmlrpc";

class Client {
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
}

export default Client;
