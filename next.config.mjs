/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: 15 * 1024 * 1024, // 15 MB
        },
    },
    // Headers for camera access
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Permissions-Policy",
                        value: "camera=*",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
