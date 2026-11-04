/**
 * Public address of this site, used for canonical links, Open Graph images, share links and JSON-LD.
 * Order: NEXT_PUBLIC_SITE_URL (set per environment; Desmond sets the real domain at go-live), then the address
 * of the current Vercel deployment (VERCEL_URL, a Vercel system variable). With neither set, siteUrl is empty
 * and links stay relative to wherever the site is served.
 */
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl).replace(/\/+$/, "");

/** metadataBase for Next.js metadata, or undefined when no address is configured. */
export const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

/** Absolute address of a path on this site (relative path when no address is configured). Full URLs pass through. */
export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`);
