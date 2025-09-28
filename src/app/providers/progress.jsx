"use client";

import { ProgressProvider } from "@bprogress/next/app";

export default function ProgressProviders({ children }) {
    return (
        <ProgressProvider
            height="4px"
            color="#000000"
            options={{ showSpinner: true }}
            shallowRouting={true}
        >
            {children}
        </ProgressProvider>
    );
}
