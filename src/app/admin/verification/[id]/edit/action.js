import { toast } from "sonner";

export const updateVerificationLine = async (
    lineId,
    qty,
    locationId,
    verifierId
) => {
    toast.loading("Updating line...");

    try {
    } catch (error) {
        toast.error("Failed to update line");
    } finally {
        toast.dismiss();
    }
};
