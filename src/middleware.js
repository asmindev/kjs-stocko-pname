export const runtime = "nodejs";

import { withAuth } from "next-auth/middleware";
import { OdooSessionManager } from "@/lib/sessionManager";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default withAuth(
    async function middleware(req) {
        // Middleware berjalan setelah user terautentikasi
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;
        const is_admin = token?.is_admin || false;
        if (pathname.startsWith("/user") && is_admin) {
            return Response.redirect(new URL("/admin/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: async ({ token, req }) => {
                // Jika mengakses halaman auth dan sudah login, redirect ke dashboard
                if (req.nextUrl.pathname.startsWith("/auth") && token) {
                    return false;
                }

                // Jika mengakses halaman protected dan belum login
                if (req.nextUrl.pathname.startsWith("/user") && !token) {
                    return false;
                }
                // Jika mengakses halaman admin dan bukan admin
                if (req.nextUrl.pathname.startsWith("/admin") && !token) {
                    return false;
                }

                const session = await getServerSession(authOptions);
                // Cek koneksi Odoo jika user sudah login
                if (session?.user) {
                    const odoo = await OdooSessionManager.getClient(
                        session.user.id,
                        session.user.email
                    );
                    // Jika koneksi Odoo tidak ada, remove session from database
                    if (!odoo) {
                        // remove session from database
                        await prisma.session.deleteMany({
                            where: {
                                user_id: parseInt(session.user.id),
                            },
                        });
                        // sign out user
                        return false;
                    }
                }

                return true;
            },
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: ["/user/:path*", "/home/:path*", "/auth/:path*", "/admin/:path*"],
};
