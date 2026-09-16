import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image optimizer to fetch attachments from local API (dev).
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9501",
        pathname: "/attachments/**",
      },
    ],
  },
};

export default nextConfig;
