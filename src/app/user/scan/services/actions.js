import { getSession } from "next-auth/react";

export const getWarehouses = async () => {
    // session = getSession()
    const session = await getSession();

    try {
        console.log("Fetching warehouses with session:", session);
    } catch (error) {
        console.error("Network error fetching warehouses:", error);
        return { error: "Network error" };
    }
};
