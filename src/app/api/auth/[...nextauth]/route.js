import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { OdooSessionManager } from "@/lib/sessionManager";
import Client from "@/app/odoo";

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

                    // get user from odoo first
                    const odoo = new Client({
                        email: credentials.email,
                        password: credentials.password,
                    });
                    const user = await odoo.getUserInfo();
                    if (!user) {
                        return null;
                    }

                    // upsert user: read update or create
                    await prisma.user.upsert({
                        // get user by id
                        where: { id: user.id },
                        // update if user exists
                        update: {
                            name: user.name,
                            email: user.email,
                            is_admin: user.is_admin,
                            role: user.role,
                            password: credentials.password,
                            updated_at: new Date(),
                        },
                        // create if user does not exist
                        create: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            password: credentials.password,
                            is_admin: user.is_admin,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });

                    // check if user can access the app
                    if (!user.can_access_opname_react) {
                        return null; // user cannot access the app
                    }
                    // get or create odoo session
                    await OdooSessionManager.getClient(
                        user.id.toString(),
                        user.email,
                        credentials.password // Password asli untuk Odoo
                    );
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        is_admin: user.is_admin,
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
        maxAge: process.env.SESSION_EXPIRATION_HOURS * 60 * 60,
    },
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.is_admin = user.is_admin;
                token.role = user.role;
            }

            if (token.id) {
                await OdooSessionManager.updateLastUsed(token.id);
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.is_admin = token.is_admin;
                session.user.role = token.role;

                // Tambahkan info session Odoo ke session
                const odooSessionInfo = await OdooSessionManager.getSessionInfo(
                    token.id
                );
                if (odooSessionInfo) {
                    session.user.odooSession = {
                        id: odooSessionInfo.id,
                        email: odooSessionInfo.email,
                        expiresAt: odooSessionInfo.expires_at, // Bisa null
                        createdAt: odooSessionInfo.created_at,
                        updatedAt: odooSessionInfo.updated_at,
                    };
                }
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
