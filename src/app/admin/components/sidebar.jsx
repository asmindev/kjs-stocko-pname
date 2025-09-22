"use client";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, LogOut, Package, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function AdminSidebar() {
    const { data: session } = useSession();

    const pathname = usePathname();

    const items = [
        {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: Home,
        },
        {
            title: "Documents",
            url: "/admin/document",
            icon: Package,
        },
    ];

    const router = useRouter();

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/auth/login" });
    };

    const navigateTo = (url) => {
        router.push(url);
    };
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Package className="h-6 w-6" />
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                            Dashboard Admin
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Admin Panel
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigasi Utama</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        onClick={() => navigateTo(item.url)}
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* <SidebarSeparator /> */}
            </SidebarContent>

            <SidebarFooter>
                {session?.user && (
                    <div className="px-2 py-2">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">
                                    {session.user.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {session.user.email}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="w-full justify-start"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
