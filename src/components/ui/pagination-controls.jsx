"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PaginationControls({
    totalCount,
    pageSize: pageSizeProp,
    page: pageProp,
    totalPages,
    // Support synonyms
    limit,
    currentPage,
    pageSizeOptions = [10, 20, 30, 50],
}) {
    const page = Number(pageProp || currentPage || 1);
    const pageSize = Number(pageSizeProp || limit || 10);
    const total = Number(totalCount || 0);
    const totalPagesCount = Number(totalPages || 1);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber, newPageSize) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        if (newPageSize) {
            params.set("limit", newPageSize.toString());
        }
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (p) => {
        router.push(createPageURL(p, pageSize));
    };

    const handleLimitChange = (val) => {
        router.push(createPageURL(1, val));
    };

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground hidden md:block">
                Showing {Math.min(total, (page - 1) * pageSize + 1)} to{" "}
                {Math.min(page * pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center space-x-4 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium hidden sm:block">
                        Rows per page
                    </p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={handleLimitChange}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={`${pageSize}`} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {`${size}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {page} of {totalPagesCount}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => handlePageChange(1)}
                        disabled={page === 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPagesCount}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => handlePageChange(totalPagesCount)}
                        disabled={page === totalPagesCount}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
