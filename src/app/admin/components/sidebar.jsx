"use client";
import { useState } from "react";
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
import { Check, Home, LogOut, Package, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";

export function AdminSidebar() {
    const { data: session } = useSession();

    const pathname = usePathname();
    const [confirmOpen, setConfirmOpen] = useState(false);

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
        {
            title: "Unposted",
            url: "/admin/unposted",
            icon: Check,
        },
    ];

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/auth/login" });
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
                                    <Link href={item.url}>
                                        <SidebarMenuButton
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </Link>
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
                            onClick={() => setConfirmOpen(true)}
                            className="w-full justify-start"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                        <Dialog
                            open={confirmOpen}
                            onOpenChange={setConfirmOpen}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Konfirmasi Logout</DialogTitle>
                                    <DialogDescription>
                                        Anda yakin ingin keluar dari aplikasi?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" size="sm">
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button size="sm" onClick={handleLogout}>
                                        Ya, Logout
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
