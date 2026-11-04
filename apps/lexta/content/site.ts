/**
 * Public address of this site, used for canonical links, Open Graph images, share links and JSON-LD.
 * Order: NEXT_PUBLIC_SITE_URL (set per environment; Desmond sets the real domain at go-live), then the Vercel
 * project's stable address (Vercel system variables). With neither set, siteUrl is empty
 * and links stay relative to wherever the site is served.
 */
// On Vercel: the project's stable production address for production builds, the branch address for previews
// (both stay the same between deploys), then the one-off deployment address.
const vercelHost =
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  process.env.VERCEL_BRANCH_URL ||
  process.env.VERCEL_URL ||
  "";
const vercelUrl = vercelHost ? `https://${vercelHost}` : "";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl).replace(/\/+$/, "");

/** metadataBase for Next.js metadata, or undefined when no address is configured. */
export const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

/** Absolute address of a path on this site (relative path when no address is configured). Full URLs pass through. */
export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`);
