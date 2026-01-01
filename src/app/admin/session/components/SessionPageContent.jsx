"use client";

import React from "react";
import { SessionList } from "./index";

export default function SessionPageContent({
    sessions,
    pagination,
    searchParams,
    stats,
}) {
    return (
        <SessionList
            sessions={sessions}
            pagination={pagination}
            searchParams={searchParams}
            stats={stats}
        />
    );
}
