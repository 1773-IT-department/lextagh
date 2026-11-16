import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/db", "@lexta/ui"],
  // The phone apps (lib/pwa.ts): the service worker is always checked for a newer version, and the manifests are
  // served with their own content type.
  async headers() {
    return [
      { source: "/lexta-sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] },
      { source: "/pwa/:file*.webmanifest", headers: [{ key: "Content-Type", value: "application/manifest+json" }, { key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/offline.html", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
