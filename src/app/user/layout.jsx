"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import UserSidebar from "./components/UserSidebar";

// Routes that should not have sidebar
const NO_SIDEBAR_ROUTES = ["/auth/login", "/"];

export default function UserLayout({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    // Don't show sidebar on auth pages or for unauthenticated users
    const shouldShowSidebar = session && !NO_SIDEBAR_ROUTES.includes(pathname);

    if (!shouldShowSidebar) {
        return children;
    }

    return (
        <SidebarProvider>
            <UserSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold">
                            KJS Product Scanner
                        </h1>
                    </div>
                </header>
                <div className="flex-1 p-2">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
