// lib/sessionManager.js
import { PrismaClient } from "@prisma/client";
import Client from "@/app/odoo";
import crypto from "crypto";

const prisma = new PrismaClient();

// Encryption untuk session data
const ENCRYPTION_KEY =
    process.env.SESSION_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = "aes-256-gcm";

class SessionEncryption {
    static encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);

        let encrypted = cipher.update(JSON.stringify(text), "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString("hex"),
            authTag: authTag.toString("hex"),
        };
    }

    static decrypt(encryptedData) {
        const { encrypted, iv, authTag } = encryptedData;

        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        decipher.setAuthTag(Buffer.from(authTag, "hex"));

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return JSON.parse(decrypted);
    }
}

export class OdooSessionManager {
    /**
     * Buat atau ambil Odoo client untuk user dari database
     */
    static async getClient(userId, email, password = null) {
        try {
            // Cari session yang masih aktif
            let activeSession = await prisma.odooSession.findFirst({
                where: {
                    user_id: parseInt(userId),
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
            });

            if (activeSession) {
                // Dekripsi session data
                const sessionData = SessionEncryption.decrypt(
                    activeSession.session_data
                );

                // Recreate Odoo client dengan data yang tersimpan
                const client = new Client({
                    email: sessionData.email,
                    password: sessionData.password, // Password akan digunakan untuk recreate client
                });

                // Test koneksi
                try {
                    await client.authenticate();
                    console.log(
                        "Reused existing Odoo session for user:",
                        userId
                    );
                    return client;
                } catch (authError) {
                    console.log("Existing session invalid, creating new one");
                    // Mark session sebagai tidak aktif
                    await prisma.odooSession.update({
                        where: { id: activeSession.id },
                        data: { is_active: false },
                    });
                    activeSession = null;
                }
            }

            // Buat session baru jika tidak ada atau tidak valid
            if (!activeSession && password) {
                const client = new Client({ email, password });

                // Test autentikasi
                const authResult = await client.authenticate();
                if (!authResult) {
                    throw new Error("Odoo authentication failed");
                }

                // Enkripsi data session
                const sessionData = SessionEncryption.encrypt({
                    email,
                    password,
                    authenticatedAt: new Date(),
                    odooUserId: authResult,
                });

                // Simpan ke database
                const HOUR = process.env.SESSION_EXPIRATION_HOURS;
                const expiry = new Date(Date.now() + HOUR * 60 * 60 * 1000);
                await prisma.odooSession.create({
                    data: {
                        user_id: parseInt(userId),
                        email,
                        session_data: sessionData,
                        expires_at: expiry,
                        is_active: true,
                    },
                });

                console.log("Created new Odoo session for user:", userId);
                return client;
            }

            throw new Error(
                "No valid Odoo session found and no password provided"
            );
        } catch (error) {
            console.error("Error in getClient:", error);
            throw error;
        }
    }

    /**
     * Hapus semua session untuk user
     */
    static async clearUserSessions(userId) {
        try {
            await prisma.odooSession.updateMany({
                where: {
                    user_id: parseInt(userId),
                    is_active: true,
                },
                data: {
                    is_active: false,
                },
            });
            console.log("Cleared sessions for user:", userId);
        } catch (error) {
            console.error("Error clearing sessions:", error);
        }
    }

    /**
     * Cleanup expired sessions (jalankan dengan cron job)
     */
    static async cleanupExpiredSessions() {
        try {
            const result = await prisma.odooSession.updateMany({
                where: {
                    expires_at: {
                        lt: new Date(),
                    },
                    is_active: true,
                },
                data: {
                    is_active: false,
                },
            });

            console.log(`Cleaned up ${result.count} expired sessions`);
            return result.count;
        } catch (error) {
            console.error("Error cleaning up sessions:", error);
        }
    }

    /**
     * Extend session expiry
     */
    static async extendSession(userId, additionalHours = 2) {
        try {
            const result = await prisma.odooSession.updateMany({
                where: {
                    user_id: parseInt(userId),
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                data: {
                    expires_at: new Date(
                        Date.now() + additionalHours * 60 * 60 * 1000
                    ),
                },
            });

            console.log(`Extended ${result.count} sessions for user:`, userId);
        } catch (error) {
            console.error("Error extending session:", error);
        }
    }

    /**
     * Get session info
     */
    static async getSessionInfo(userId) {
        try {
            const session = await prisma.odooSession.findFirst({
                where: {
                    user_id: parseInt(userId),
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    expires_at: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            return session;
        } catch (error) {
            console.error("Error getting session info:", error);
            return null;
        }
    }
}

// Cleanup job - jalankan setiap 1 jam
setInterval(async () => {
    await OdooSessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000); // 1 hour
