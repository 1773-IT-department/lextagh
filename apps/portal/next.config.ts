import type { NextConfig } from "next";

const nextConfig: NextConfig = { transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/ui"] };

export default nextConfig;
