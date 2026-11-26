import type { NextConfig } from "next";

const extraApiPatterns = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  try {
    const parsed = new URL(raw);
    if (parsed.hostname === "api.txepro.vn") return [];
    const protocol = parsed.protocol === "http:" ? ("http" as const) : ("https" as const);
    return [
      { protocol, hostname: parsed.hostname, port: parsed.port || undefined, pathname: "/uploads/**" },
      { protocol, hostname: parsed.hostname, port: parsed.port || undefined, pathname: "/marketing/**" },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    const www = [{ type: "host" as const, value: "www.txepro.vn" }];
    return [
      { source: "/", has: www, destination: "https://txepro.vn/", permanent: true },
      { source: "/:path+", has: www, destination: "https://txepro.vn/:path+", permanent: true },
    ];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      { source: "/admin/:path*", headers: noindex },
      { source: "/user/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
      { source: "/don-cua-ban/:path*", headers: noindex },
      { source: "/tai-xe/phuong-tien/:path*", headers: noindex },
    ];
  },
  allowedDevOrigins: [
    "txepro.vn",
    "www.txepro.vn",
  ],

  images: {
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.txepro.vn",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.txepro.vn",
        pathname: "/marketing/**",
      },
      ...extraApiPatterns,
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;