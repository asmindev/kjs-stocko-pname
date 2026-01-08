import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./components/sidebar";

export default function AdminLayout({ children }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <main className="w-full flex-1 overflow-x-hidden p-2">
                <SidebarTrigger />
                {children}
            </main>
        </SidebarProvider>
    );
}
