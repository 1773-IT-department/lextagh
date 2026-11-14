/**
 * Linzzy products, read live from Product Management ("edit once, every site updates").
 *
 * The same read the Lexta site's Our Brands page and the Yazz site use: getPublishedProducts("linzzy") in packages/db,
 * which joins the brands table by slug (no hard-coded brand id), uses the publishable key (Row Level Security only
 * returns published products of active brands) and caches under the "products" tag for up to an hour. The portal calls
 * this site's /api/revalidate after every product save, which clears the tag and rebuilds the product pages.
 * Each product is put in one of the two ranges by its category (rangeOf in ./ranges.ts).
 * If the database cannot be reached, or the site has no Supabase settings, Lexta's own catalogue (content/catalogue.ts)
 * is shown and a warning is logged, so pages never break.
 */
import { getPublishedProducts, type PublishedProduct } from "@lexta/db";
import { CATALOGUE } from "../content/catalogue";
import { rangeOf, type RangeSlug } from "./ranges";

export const BRAND_SLUG = "linzzy";

export type LinzzyProduct = {
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
  /** Lexta's product page extras (content/catalogue.ts); a database row with the same slug borrows them. */
  headline?: string;
  recommended?: string;
  sensitivity?: string;
  says?: string;
  /** Tips & Advice articles that go with the product (slugs). */
  reads?: string[];
  /** Announced but not on sale yet: a Coming soon badge and no Where to buy link. */
  comingSoon?: boolean;
};

export function toLinzzyProduct(p: PublishedProduct): LinzzyProduct {
  const base: LinzzyProduct = {
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
  // The database wins for everything it holds. Lexta's extra product page words (headline, recommended use, skin
  // sensitivity, sign-off, related articles) and, when Product Management has no photo yet, the catalogue's pack shot
  // come from the catalogue entry with the same slug.
  const c = CATALOGUE.find((x) => x.slug === p.slug);
  if (!c) return base;
  return {
    ...base,
    headline: c.headline, recommended: c.recommended, sensitivity: c.sensitivity, says: c.says, reads: c.reads,
    images: base.images.length ? base.images : c.images,
  };
}

/** Every published Linzzy product in Product Management's display order, and whether they came from the database. */
export async function getLinzzyProducts(): Promise<{ products: LinzzyProduct[]; live: boolean }> {
  try {
    const rows = await getPublishedProducts(BRAND_SLUG);
    const products = rows.map(toLinzzyProduct);
    // Coming soon items from Lexta's catalogue show even when the database has no row (none for Linzzy today; the
    // pattern is kept so Lexta can announce one). One is left out when a live product already covers it.
    const soon = CATALOGUE.filter((c) => c.comingSoon && !products.some((p) => p.slug === c.slug));
    return { products: [...products, ...soon], live: true };
  } catch (error) {
    console.warn(`[products] showing the catalogue from content/catalogue.ts: ${error instanceof Error ? error.message : String(error)}`);
    return { products: CATALOGUE, live: false };
  }
}

/** The products of one range. */
export const inRange = (products: LinzzyProduct[], range: RangeSlug) => products.filter((p) => p.range === range);
