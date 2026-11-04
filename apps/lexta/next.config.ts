import type { NextConfig } from "next";

/**
 * Migration bridge.
 * The approved static prototype lives in /public as plain .html files.
 * Each clean URL below falls back to its .html file ONLY while no Next.js route exists for it
 * (afterFiles rewrites run after app routes). When a page is converted to app/<slug>/page.tsx,
 * the new route wins automatically; then delete the .html file and move its name to convertedPages.
 * Home (/) is converted: app/(site)/page.tsx. /index.html still redirects to /. Other converted pages are listed in convertedPages.
 */
const legacyPages = [
  "contact-us", "faqs",
  "partner-with-us", "privacy-policy", "terms-and-conditions",
];

/** Pages already converted to Next.js routes. Their old .html links still redirect to the clean URL. */
const convertedPages = ["about-us", "our-brands", "people-and-culture", "corporate-social-responsibility", "news", "careers"];

const nextConfig: NextConfig = {
  transpilePackages: ["@lexta/db"],
  async redirects() {
    // Old links like /about-us.html go to the clean URL.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...[...convertedPages, ...legacyPages].map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        ...legacyPages.map((p) => ({ source: `/${p}`, destination: `/${p}.html` })),
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
