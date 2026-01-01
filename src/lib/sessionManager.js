// lib/sessionManager.js
import { prisma } from "@/lib/prisma";
import Client from "@/app/odoo";
import crypto from "crypto";

// --- Encryption untuk session data ---
const ENCRYPTION_KEY = crypto
    .createHash("sha256")
    .update(String(process.env.SESSION_ENCRYPTION_KEY))
    .digest(); // hasilnya 32 bytes

const ALGORITHM = "aes-256-gcm";

class SessionEncryption {
    static encrypt(data) {
        const iv = crypto.randomBytes(16); // wajib untuk GCM
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data), "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        return {
            encrypted: encrypted.toString("hex"),
            iv: iv.toString("hex"),
            authTag: authTag.toString("hex"),
        };
    }

    static decrypt(encryptedData) {
        const { encrypted, iv, authTag } = encryptedData;

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            ENCRYPTION_KEY,
            Buffer.from(iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(authTag, "hex"));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, "hex")),
            decipher.final(),
        ]);

        return JSON.parse(decrypted.toString("utf8"));
    }
}

export class OdooSessionManager {
    static async getClient(userId, email, password = null) {
        try {
            let activeSession = await prisma.odooSession.findFirst({
                where: { user_id: parseInt(userId), is_active: true },
                orderBy: { created_at: "desc" },
            });

            if (activeSession) {
                const sessionData = SessionEncryption.decrypt(
                    activeSession.session_data
                );
                const client = new Client({
                    email: sessionData.email,
                    password: sessionData.password,
                });

                try {
                    await client.authenticate();
                    return client;
                } catch (authError) {
                    console.log("Existing session invalid, creating new one");
                    await prisma.odooSession.update({
                        where: { id: activeSession.id },
                        data: { is_active: false },
                    });
                    activeSession = null;
                }
            }

            if (!activeSession && password) {
                console.log({ userId, email, password });
                const client = new Client({ email, password });
                const authResult = await client.authenticate();
                if (!authResult) throw new Error("Odoo authentication failed");

                const sessionData = SessionEncryption.encrypt({
                    email,
                    password,
                    authenticatedAt: new Date(),
                    odooUserId: authResult,
                });

                await prisma.odooSession.create({
                    data: {
                        user_id: parseInt(userId),
                        email,
                        session_data: sessionData,
                        expires_at: new Date("2099-12-31"),
                        is_active: true,
                    },
                });

                console.log("Created new Odoo session for user:", userId);
                return client;
            }

            if (!activeSession && !password) return null;

            throw new Error(
                "No valid Odoo session found and no password provided"
            );
        } catch (error) {
            console.error("Error in getClient:", error);
            throw error;
        }
    }

    static async clearUserSessions(userId) {
        try {
            await prisma.odooSession.updateMany({
                where: { user_id: parseInt(userId), is_active: true },
                data: { is_active: false },
            });
            console.log("Cleared sessions for user:", userId);
        } catch (error) {
            console.error("Error clearing sessions:", error);
        }
    }

    static async cleanupInactiveSessions() {
        try {
            const result = await prisma.odooSession.deleteMany({
                where: { is_active: false },
            });
            console.log(`Cleaned up ${result.count} inactive sessions`);
            return result.count;
        } catch (error) {
            console.error("Error cleaning up sessions:", error);
        }
    }

    static async getSessionInfo(userId) {
        try {
            return await prisma.odooSession.findFirst({
                where: { user_id: parseInt(userId), is_active: true },
                select: {
                    id: true,
                    email: true,
                    expires_at: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { created_at: "desc" },
            });
        } catch (error) {
            console.error("Error getting session info:", error);
            return null;
        }
    }

    static async invalidateSession(sessionId) {
        try {
            await prisma.odooSession.update({
                where: { id: sessionId },
                data: { is_active: false },
            });
            console.log("Invalidated session:", sessionId);
        } catch (error) {
            console.error("Error invalidating session:", error);
        }
    }

    static async getUserActiveSessions(userId) {
        try {
            return await prisma.odooSession.findMany({
                where: { user_id: parseInt(userId), is_active: true },
                select: {
                    id: true,
                    email: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { created_at: "desc" },
            });
        } catch (error) {
            console.error("Error getting user sessions:", error);
            return [];
        }
    }

    static async updateLastUsed(userId) {
        try {
            await prisma.odooSession.updateMany({
                where: { user_id: parseInt(userId), is_active: true },
                data: { updated_at: new Date() },
            });
        } catch (error) {
            console.error("Error updating last used:", error);
        }
    }
}

setInterval(async () => {
    await OdooSessionManager.cleanupInactiveSessions();
}, 24 * 60 * 60 * 1000); // 24 jam
