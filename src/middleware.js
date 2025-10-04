export const runtime = "nodejs";

import { withAuth } from "next-auth/middleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "./lib/sessionManager";

/**
 * Fungsi untuk mencatat log setiap request.
 * Bisa diganti untuk menyimpan ke file atau database.
 */
async function logRequest(req, user) {
    const time = new Date().toISOString();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const userId = user?.id || "GUEST";

    // Contoh log ke console
    console.log(`[${time}] ${method} ${url} by ${userId}`);

    // Contoh jika mau simpan ke database:
    // await prisma.requestLog.create({
    //     data: {
    //         method,
    //         path: url,
    //         userId: user ? parseInt(user.id) : null,
    //         timestamp: new Date(),
    //     },
    // });
}

export default withAuth(
    async function middleware(req) {
        // Ambil session untuk log user
        const session = await getServerSession(authOptions);
        await logRequest(req, session?.user);

        // Middleware berjalan setelah user terautentikasi
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;
        const is_admin = token?.is_admin || false;

        if (pathname.startsWith("/user") && is_admin) {
            return Response.redirect(new URL("/admin/dashboard", req.url));
        }

        if (pathname.startsWith("/admin") && !is_admin) {
            return Response.redirect(new URL("/user/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: async ({ token, req }) => {
                // Jika mengakses halaman auth dan sudah login
                if (req.nextUrl.pathname.startsWith("/auth") && token) {
                    return false;
                }

                // Jika mengakses halaman user/admin tapi belum login
                if (
                    (req.nextUrl.pathname.startsWith("/user") ||
                        req.nextUrl.pathname.startsWith("/admin")) &&
                    !token
                ) {
                    return false;
                }

                // Cek koneksi Odoo jika user sudah login
                const session = await getServerSession(authOptions);
                if (session?.user) {
                    const odoo = await OdooSessionManager.getClient(
                        session.user.id,
                        session.user.email
                    );

                    if (!odoo) {
                        // Hapus session dari database
                        await prisma.session.deleteMany({
                            where: { user_id: parseInt(session.user.id) },
                        });
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
