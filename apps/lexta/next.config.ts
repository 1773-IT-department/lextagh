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
  // The Careers application form posts the CV in the form itself when JavaScript is off (with JavaScript the browser
  // uploads it to Storage directly). CVs can be 5 MB, so allow a little more than that per form post.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...convertedPages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
};

export default nextConfig;
