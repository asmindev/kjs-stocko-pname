"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, Package, BarChart3, Scan } from "lucide-react";

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
    SidebarMenuAction,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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

// Menu items.

export default function UserSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/auth/login" });
    };

    const navigateTo = (url) => {
        router.push(url);
    };

    const items = [
        {
            title: "Dashboard",
            url: "/user/dashboard",
            icon: BarChart3,
        },
        {
            title: "Scanner",
            url: "/user/scan",
            icon: Scan,
        },
        ...(session?.user?.role === "leader" || session?.user?.role === "admin"
            ? [
                  {
                      title: "To Confirm",
                      url: "/user/confirm",
                      icon: Scan,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Package className="h-6 w-6" />
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                            KJS Scanner
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Product Scanner
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
