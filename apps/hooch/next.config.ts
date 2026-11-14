import type { NextConfig } from "next";

/**
 * The Hooch brand site, 6 pages (Lexta's six Hooch tabs, "Hooch Foods website content.docx"):
 *   1. Home                         /
 *   2. About Hooch®                 /about
 *   3. Our Products                 /products, each cereal at /products/[slug]
 *   4. Breakfast Ideas & Recipes    /recipes, each recipe at /recipes/[slug]
 *   5. Nutrition & Family Tips      /nutrition (with the product FAQs), each article at /nutrition/[slug]
 *   6. Contact & Where to Buy       /contact
 * Lexta's seventh item, "Meet hochiro, coming soon", and the Phase 2 games, comics and shop are not built (scope).
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
};

export default nextConfig;
