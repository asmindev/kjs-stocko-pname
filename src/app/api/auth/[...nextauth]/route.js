import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { OdooSessionManager } from "@/lib/sessionManager";

const prisma = new PrismaClient();

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    // Cari user di database lokal
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user) {
                        return null;
                    }

                    // Verify password lokal
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    // Buat atau ambil Odoo session
                    try {
                        await OdooSessionManager.getClient(
                            user.id.toString(),
                            user.email,
                            credentials.password // Password asli untuk Odoo
                        );
                        console.log(
                            "Odoo session created/retrieved successfully"
                        );
                    } catch (error) {
                        console.error("Odoo session failed:", error);
                        // Bisa pilih: gagalkan login atau lanjutkan tanpa Odoo
                        return null; // Uncomment untuk gagalkan login jika Odoo tidak tersedia
                    }

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error("Authentication error:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: process.env.SESSION_EXPIRATION_HOURS * 60 * 60, // 2 hours (sesuai dengan Odoo session)
    },
    pages: {
        signIn: "/auth/login",
        signUp: "/auth/register",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
            }

            // Extend Odoo session saat JWT di-refresh
            if (trigger === "update" && token.id) {
                await OdooSessionManager.extendSession(token.id);
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;

                // Tambahkan info session Odoo ke session
                const odooSessionInfo = await OdooSessionManager.getSessionInfo(
                    token.id
                );
                session.user.odooSession = odooSessionInfo;
            }
            return session;
        },
        async signOut({ token }) {
            // Cleanup Odoo session saat logout
            if (token?.id) {
                await OdooSessionManager.clearUserSessions(token.id);
            }
        },
    },
    events: {
        async signOut({ token }) {
            // Event listener untuk logout
            if (token?.id) {
                await OdooSessionManager.clearUserSessions(token.id);
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
