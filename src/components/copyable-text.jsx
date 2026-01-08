"use client";

import { toast } from "sonner";

export function CopyableText({ text, className }) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard: " + text);
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    return (
        <span
            onClick={handleCopy}
            className={`cursor-pointer hover:underline ${className || ""}`}
            title="Click to copy"
        >
            {text}
        </span>
    );
}
