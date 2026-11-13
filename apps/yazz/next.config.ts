import type { NextConfig } from "next";

/**
 * The Yazz brand site: Home, Products, the product range page (one template at /products/[range], used for the five
 * ranges in Lexta's content: Feminine Care, Oral Care, Home & Tissue, Baby Care and Home Care), About Us, Tips & Articles
 * (the list at /tips, and each article on its own article page at /tips/[slug]) and Contact & Where to Buy.
 * How these count against the contract's 6 pages per brand site is for Desmond to confirm.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
};

export default nextConfig;
