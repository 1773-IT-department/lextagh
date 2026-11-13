/**
 * Yazz products, read live from Product Management ("edit once, every site updates").
 *
 * The same read the Lexta site's Our Brands page uses: getPublishedProducts("yazz") in packages/db, which joins the
 * brands table by slug (no hard-coded brand id), uses the publishable key (Row Level Security only returns published
 * products of active brands) and caches under the "products" tag for up to an hour. The portal calls this site's
 * /api/revalidate after every product save, which clears the tag and rebuilds the product pages.
 * Each product is put in one of the three ranges by its category (rangeOf in ./ranges.ts).
 * If the database cannot be reached, or the site has no Supabase settings, Lexta's own catalogue (content/catalogue.ts)
 * is shown without photos and a warning is logged, so pages never break.
 */
import { getPublishedProducts, type PublishedProduct } from "@lexta/db";
import { CATALOGUE } from "../content/catalogue";
import { rangeOf, type RangeSlug } from "./ranges";

export const BRAND_SLUG = "yazz";

export type YazzProduct = {
  slug: string;
  name: string;
  range: RangeSlug;
  category: string | null;
  short: string;
  long: string;
  features: string[];
  usage: string | null;
  ingredients: string | null;
  skus: { code: string; variant: string | null; pack: string }[];
  images: { src: string; alt: string }[];
};

export function toYazzProduct(p: PublishedProduct): YazzProduct {
  return {
    slug: p.slug,
    name: p.name,
    range: rangeOf(p.category, p.name),
    category: p.category,
    short: p.short_description ?? p.long_description ?? "",
    long: p.long_description ?? p.short_description ?? "",
    features: p.key_features ?? [],
    usage: p.usage_instructions,
    ingredients: p.ingredients,
    skus: p.skus.map((s) => ({ code: s.sku_code, variant: s.variant_name, pack: s.pack_size_label })),
    images: p.images.map((i) => ({ src: i.url, alt: i.alt_text })),
  };
}

/** Every published Yazz product in Product Management's display order, and whether they came from the database. */
export async function getYazzProducts(): Promise<{ products: YazzProduct[]; live: boolean }> {
  try {
    const rows = await getPublishedProducts(BRAND_SLUG);
    return { products: rows.map(toYazzProduct), live: true };
  } catch (error) {
    console.warn(`[products] showing the catalogue from content/catalogue.ts: ${error instanceof Error ? error.message : String(error)}`);
    return { products: CATALOGUE, live: false };
  }
}

/** The products of one range. */
export const inRange = (products: YazzProduct[], range: RangeSlug) => products.filter((p) => p.range === range);
