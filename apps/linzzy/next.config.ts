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
  // "Report a problem" can carry a photo or document (at most 5 MB). With JavaScript the browser uploads it straight
  // to Storage; without JavaScript it comes in the form post. Server actions take 1 MB by default; allow Vercel's own
  // request limit, 4.5 MB, and no more (so without JavaScript files up to about 4.4 MB go through).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
};

export default nextConfig;
