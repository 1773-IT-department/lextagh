import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Search engines may index the site only on a production deployment that has its real address set
 * (NEXT_PUBLIC_SITE_URL, which Desmond sets at go-live). Previews, and the vercel.app production alias before go-live,
 * disallow everything.
 */
export default function robots(): MetadataRoute.Robots {
  const live = process.env.VERCEL_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_SITE_URL);
  return {
    rules: live ? { userAgent: "*", allow: "/", disallow: "/api/" } : { userAgent: "*", disallow: "/" },
    sitemap: live && siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
