"use client";

import React from "react";
import { SessionList } from "./index";

export default function SessionPageContent({ sessions }) {
    return <SessionList sessions={sessions} />;
}
