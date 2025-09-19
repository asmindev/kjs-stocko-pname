import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import SessionWrapper from "@/components/SessionWrapper";
import "./static/globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// export const metadata = {
//     title: "Scanner Product",
//     description: "Aplikasi scanner barcode produk",
//     viewport:
//         "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
// };

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SessionWrapper>
                    {children}
                    <Toaster position="top-right" duration={2000} />
                </SessionWrapper>
            </body>
        </html>
    );
}
