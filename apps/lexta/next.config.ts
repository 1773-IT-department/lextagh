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
  transpilePackages: ["@lexta/chat", "@lexta/db", "@lexta/forms", "@lexta/ui"],
  // The Careers application form posts the CV (at most 4 MB) to its server action, with or without JavaScript.
  // Server actions take 1 MB by default; allow Vercel's own request limit, 4.5 MB, and no more.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...convertedPages.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
};

export default nextConfig;
