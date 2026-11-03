/**
 * Public address of this site, used for canonical links, Open Graph images and JSON-LD.
 * Order: NEXT_PUBLIC_SITE_URL (set it per environment; Desmond sets the real domain at go-live),
 * then the Vercel project's production address (a Vercel system variable), then local dev.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || "http://localhost:3000").replace(/\/+$/, "");

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`);
