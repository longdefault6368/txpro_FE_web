import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const www = [{ type: "host" as const, value: "www.txepro.vn" }];
    return [
      { source: "/", has: www, destination: "https://txepro.vn/", permanent: true },
      { source: "/:path+", has: www, destination: "https://txepro.vn/:path+", permanent: true },
    ];
  },
  allowedDevOrigins: [
    "txepro.vn",
    "www.txepro.vn",
  ],

  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;