import path from "node:path";
import type { NextConfig } from "next";

// Real listing/dealer/profile photos are served straight from the Laravel backend's own
// storage disk (Storage::disk('public')->url(...)) — next/image refuses to optimize an
// external host unless it's explicitly allowlisted here, so derive that host from the same
// API URL the app already talks to instead of hardcoding it.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
