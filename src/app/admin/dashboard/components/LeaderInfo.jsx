import { Users } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LeaderInfo({ selectedLeader }) {
    if (!selectedLeader) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {selectedLeader.name}
                </CardTitle>
                <CardDescription>
                    Email: {selectedLeader.email} | Tanggung Jawab:{" "}
                    {selectedLeader.inventory_product_location_ids?.length || 0}{" "}
                    lokasi
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
