import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Each local dev frontend needs its own Next cache/lock; production uses .next.
  distDir: process.env.NEXT_DIST_DIR && /^\.next-[a-z0-9-]+$/.test(process.env.NEXT_DIST_DIR)
    ? process.env.NEXT_DIST_DIR : ".next",
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
