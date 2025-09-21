import { withAuth } from "next-auth/middleware";

export default withAuth(
    function middleware(req) {
        // Middleware berjalan setelah user terautentikasi
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;
        const is_admin = token?.is_admin || false;
        if (pathname.startsWith("/user") && is_admin) {
            return Response.redirect(new URL("/admin/dashboard", req.url));
        }

        console.log("User token:", token);
        console.log("Middleware executed for:", req.nextUrl.pathname);
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Jika mengakses halaman auth dan sudah login, redirect ke dashboard
                if (req.nextUrl.pathname.startsWith("/auth") && token) {
                    return false;
                }

                // Jika mengakses halaman protected dan belum login
                if (req.nextUrl.pathname.startsWith("/user") && !token) {
                    return false;
                }

                if (req.nextUrl.pathname.startsWith("/home") && !token) {
                    return false;
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
