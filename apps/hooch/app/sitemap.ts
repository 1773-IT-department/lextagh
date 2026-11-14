import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { CATALOGUE } from "@/content/catalogue";
import { RECIPES } from "@/content/recipes";
import { siteUrl } from "@/lib/site";

/** Every page of the site. Absolute only when the site's address is known (NEXT_PUBLIC_SITE_URL or Vercel's). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/about", "/products", ...CATALOGUE.map((c) => `/products/${c.slug}`), "/recipes", ...RECIPES.map((r) => `/recipes/${r.slug}`),
    "/nutrition", ...ARTICLES.map((a) => `/nutrition/${a.slug}`), "/contact",
  ];
  return paths.map((p) => ({ url: `${siteUrl}${p}` }));
}
