import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { RANGE_SLUGS } from "@/lib/ranges";
import { siteUrl } from "@/lib/site";

/** Every page of the site. Absolute only when the site's address is known (NEXT_PUBLIC_SITE_URL or Vercel's). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/products", ...RANGE_SLUGS.map((r) => `/products/${r}`), "/about", "/faqs", "/tips", ...ARTICLES.map((a) => `/tips/${a.slug}`), "/contact"];
  return paths.map((p) => ({ url: `${siteUrl}${p}` }));
}
