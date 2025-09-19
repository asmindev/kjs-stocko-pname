"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return; // Still loading

        if (session) {
            // User is logged in, redirect to dashboard
            router.push("/user/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Redirecting to dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        KJS Scanner Product
                    </h1>
                    <p className="text-gray-600">
                        Aplikasi scanner barcode produk dengan integrasi Odoo
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            Selamat Datang
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-gray-600">
                            Untuk menggunakan aplikasi ini, Anda perlu login
                            terlebih dahulu.
                        </p>

                        <div className="space-y-3">
                            <Button
                                className="w-full"
                                onClick={() => router.push("/auth/login")}
                            >
                                Login
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push("/auth/register")}
                            >
                                Daftar Akun Baru
                            </Button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                Pastikan Anda sudah terdaftar di sistem Odoo
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
