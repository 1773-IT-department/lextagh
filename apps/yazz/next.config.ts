import type { NextConfig } from "next";

/**
 * The Yazz brand site (6 pages): Home, Products, a product range (one layout for the three ranges), About Us,
 * Tips & Articles (an article is the same page template at /tips/<slug>) and Contact & Where to Buy.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
};

export default nextConfig;
