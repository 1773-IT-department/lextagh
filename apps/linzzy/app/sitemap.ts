import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { siteUrl } from "@/lib/site";

/** Every page of the site (the old /products/<range> addresses redirect to /products, so they are not listed). Absolute only when the site's address is known (NEXT_PUBLIC_SITE_URL or Vercel's). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/products", "/about", "/faqs", "/tips", ...ARTICLES.map((a) => `/tips/${a.slug}`), "/contact"];
  return paths.map((p) => ({ url: `${siteUrl}${p}` }));
}
