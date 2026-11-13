import type { NextConfig } from "next";

/**
 * The Yazz brand site, 6 pages:
 *   1. Home                       /
 *   2. Products                   /products, with the five range pages on one template (/products/[range])
 *   3. About Us                   /about
 *   4. Tips & Articles            /tips, with the articles at /tips/[slug]
 *   5. FAQs                       /faqs
 *   6. Contact & Where to Buy     /contact
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
};

export default nextConfig;
