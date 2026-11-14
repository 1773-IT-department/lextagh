import type { NextConfig } from "next";

/**
 * The Linzzy brand site, 6 pages (the same structure Desmond approved for Yazz):
 *   1. Home                       /
 *   2. Products                   /products, with the two ranges on one template (/products/[range])
 *   3. About Us                   /about
 *   4. Tips & Advice              /tips, with the articles at /tips/[slug]
 *   5. FAQs                       /faqs
 *   6. Contact & Where to Buy     /contact
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
};

export default nextConfig;
