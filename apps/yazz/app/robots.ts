import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Previews are not indexed; only a production deployment (Desmond's go-live) lets search engines in. */
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === "production";
  return {
    rules: production ? { userAgent: "*", allow: "/", disallow: "/api/" } : { userAgent: "*", disallow: "/" },
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
