/** @type {import('next').NextConfig} */
const nextConfig = {
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
