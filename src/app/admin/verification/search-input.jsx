"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";


export default function SearchInput({ placeholder = "Search..." }) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = (term) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        replace(`${window.location.pathname}?${params.toString()}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch(e.target.value);
        }
    };

    return (
        <div className="relative flex flex-1 flex-shrink-0">
            <Input
                className="w-full md:w-[300px]"
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                defaultValue={searchParams.get("q")?.toString()}
            />
        </div>
    );
}
