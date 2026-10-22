import type { NextConfig } from "next";

/**
 * Migration bridge.
 * The approved static prototype lives in /public as plain .html files.
 * Each clean URL below falls back to its .html file ONLY while no Next.js route exists for it
 * (afterFiles rewrites run after app routes). When a page is converted to app/<slug>/page.tsx,
 * the new route wins automatically; then delete the .html file and its line here.
 */
const legacyPages = [
  "about-us", "careers", "contact-us", "corporate-social-responsibility", "faqs", "news",
  "our-brands", "partner-with-us", "people-and-culture", "privacy-policy", "terms-and-conditions",
];

const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/db"],
  async redirects() {
    // Old links like /about-us.html go to the clean URL.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...legacyPages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/index.html" },
        ...legacyPages.map((p) => ({ source: `/${p}`, destination: `/${p}.html` })),
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
