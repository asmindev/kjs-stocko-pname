import React from "react";
import SessionDetail from "./SessionDetail";
import { getSessionById } from "@/app/user/dashboard/services/actions";

export default async function Detail({ params }) {
    const { id } = await params;
    const result = await getSessionById(id);
    if (!result.success) {
        return <div className="p-4">Session not found.</div>;
    }

    return <SessionDetail data={result.data} />;
}
