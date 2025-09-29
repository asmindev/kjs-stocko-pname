"use client";

import { ProgressProvider } from "@bprogress/next/app";

export default function ProgressProviders({ children }) {
    return (
        <ProgressProvider
            height="2px"
            color="#000000"
            options={{ showSpinner: false }}
            shallowRouting={true}
        >
            {children}
        </ProgressProvider>
    );
}
