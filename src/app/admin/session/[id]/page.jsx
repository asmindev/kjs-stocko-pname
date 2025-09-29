import React from "react";
import SessionDetail from "./SessionDetail";
import { getSessionById } from "./actions";

export default async function Detail({ params }) {
    const { id } = await params;
    const result = await getSessionById(id);

    return <SessionDetail data={result.data} />;
}
