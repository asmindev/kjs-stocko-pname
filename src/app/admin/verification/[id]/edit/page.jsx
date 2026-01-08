import {
    getVerificationLine,
    getInventoryLocationsForEdit,
    getOpnameUsers,
} from "../../action";
import { VerificationEditForm } from "./edit-form";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function EditPage(props) {
    const params = await props.params;
    const { id } = params;

    // Parallel Data Fetching
    const [lineReq, locReq, usersReq] = await Promise.all([
        getVerificationLine(id),
        getInventoryLocationsForEdit(),
        getOpnameUsers(),
    ]);

    const locations = locReq.data.locations.filter(
        (loc) => loc.stock_location_id[0] === lineReq.data.location_id
    );
    if (!lineReq.success) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    Gagal memuat data baris: {lineReq.error}
                </div>
            </div>
        );
    }

    if (!locReq.success || !usersReq.success) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    Gagal memuat data form. Mohon periksa koneksi.
                    <br />
                    Error Lokasi: {locReq.error}
                    <br />
                    Error Pengguna: {usersReq.error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Data Verifikasi</CardTitle>
                    <CardDescription>
                        Kelola data verifikasi tambahan untuk item ini.
                    </CardDescription>
                </CardHeader>
                <VerificationEditForm
                    line={lineReq.data}
                    locations={locations}
                    users={usersReq.data}
                />
            </Card>
        </div>
    );
}
