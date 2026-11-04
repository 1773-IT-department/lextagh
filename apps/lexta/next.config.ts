import type { NextConfig } from "next";

/**
 * Every page of the approved prototype is now a Next.js route under app/(site), so the old
 * .html-in-/public rewrite bridge is gone. Old links and bookmarks such as /about-us.html
 * still redirect permanently to the clean URL.
 */
const convertedPages = [
  "about-us", "our-brands", "people-and-culture", "corporate-social-responsibility", "news", "careers",
  "contact-us", "partner-with-us", "faqs", "privacy-policy", "terms-and-conditions",
];

const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/db"],
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...convertedPages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
};

export default nextConfig;
