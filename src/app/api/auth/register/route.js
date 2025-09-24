import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import Client from "@/app/odoo";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        // Validasi input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email dan password harus diisi" },
                { status: 400 }
            );
        }

        // Cek apakah user sudah terdaftar di database lokal
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User sudah terdaftar" },
                { status: 400 }
            );
        }

        // Validasi dengan Odoo dan ambil info user
        const odooClient = new Client({ email, password });
        const userInfo = await odooClient.getUserInfo();

        if (!userInfo) {
            return NextResponse.json(
                { error: "Email atau password tidak valid di Odoo" },
                { status: 401 }
            );
        }

        // check if user can access the app
        if (!userInfo.can_access_opname_react) {
            return NextResponse.json(
                { error: "Anda tidak memiliki akses ke aplikasi ini" },
                { status: 403 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Simpan user ke database lokal dengan ID dari Odoo
        const user = await prisma.user.create({
            data: {
                id: userInfo.id, // Gunakan Odoo ID sebagai primary key
                name: userInfo.name,
                email,
                password: hashedPassword,
            },
        });

        // Return user tanpa password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "User berhasil didaftarkan",
                user: userWithoutPassword,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
