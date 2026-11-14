/**
 * Linzzy products, read live from Product Management ("edit once, every site updates").
 *
 * The same read the Lexta site's Our Brands page and the Yazz site use: getPublishedProducts("linzzy") in packages/db,
 * which joins the brands table by slug (no hard-coded brand id), uses the publishable key (Row Level Security only
 * returns published products of active brands) and caches under the "products" tag for up to an hour. The portal calls
 * this site's /api/revalidate after every product save, which clears the tag and rebuilds the product pages.
 * Each product is put in one of the two ranges by its category (rangeOf in ./ranges.ts).
 * Lexta's Drive catalogue (content/catalogue.ts) is the authority for product wording: a database row with a catalogue
 * slug shows the Drive text, the prototype seed rows without a Drive product are skipped, catalogue products the
 * database lacks are added, and no image from Lexta's real domains is ever shown (mergeLinzzyProducts below).
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

/**
 * Lexta's real domains. The prototype seed (0004) hotlinked product photos from them (one is a campaign poster); the
 * site never shows a picture served from one of them, whatever the database says.
 */
const BLOCKED_IMAGE_HOSTS = ["lextagh.com", "yazzproducts.com", "linzzyproducts.com", "hoochfoods.com"];

/** True when an image address points at one of Lexta's real domains (with or without www). */
export function isBlockedImage(src: string): boolean {
  try {
    const host = new URL(src, "https://local.invalid").hostname.toLowerCase().replace(/^www\./, "");
    return BLOCKED_IMAGE_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/**
 * The Linzzy rows seeded from the Lexta prototype (migration 0004) that have no product in Lexta's Drive catalogue, with
 * the range each stood for. "Sanitary napkins" and "Baby care" are umbrella cards with invented claims; while
 * content/catalogue.ts covers the range, the site skips them even if they are still published (migration 0016, when
 * Desmond applies it, unpublishes them). Only these two slugs: any product staff create later shows as usual.
 * The third seed row, "baby-wipes", has the same slug as the catalogue's Linzzy Baby Wipes, so it is merged instead.
 */
export const PROTOTYPE_SEED_SLUGS: Record<string, RangeSlug> = {
  "sanitary-napkins": "feminine-care",
  "baby-care": "baby-care",
};

export function toLinzzyProduct(p: PublishedProduct): LinzzyProduct {
  const images = p.images.filter((i) => !isBlockedImage(i.url)).map((i) => ({ src: i.url, alt: i.alt_text }));
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
    images,
  };
  // A row with the same slug as a product in Lexta's Drive catalogue: the Drive wording wins for the name, the short and
  // long text, the features, how to use and the ingredients, together with Lexta's product page extras (headline,
  // recommended use, skin sensitivity, sign-off, related articles). The database only supplies what Drive lacks: the
  // SKU codes and pack sizes, the photos (the catalogue pack shot when it has none, or only blocked ones) and its
  // published state and display order.
  const c = CATALOGUE.find((x) => x.slug === p.slug);
  if (!c) return base;
  return {
    ...c,
    category: base.category ?? c.category,
    usage: c.usage ?? base.usage,
    ingredients: c.ingredients ?? base.ingredients,
    skus: base.skus.length ? base.skus : c.skus,
    images: images.length ? images : c.images,
    comingSoon: undefined,
  };
}

/**
 * The site's product list from the published database rows: prototype seed rows skipped, rows merged with the
 * catalogue, and every catalogue product the database lacks added from content/catalogue.ts (coming soon items too),
 * so the full Linzzy range always shows. While the database holds every catalogue product, Product Management's order
 * is kept; until then the catalogue's order comes first, followed by the products staff added.
 */
export function mergeLinzzyProducts(rows: PublishedProduct[]): LinzzyProduct[] {
  const covered = (range: RangeSlug) => CATALOGUE.some((c) => c.range === range && !c.comingSoon);
  const live = rows
    .filter((r) => !(r.slug in PROTOTYPE_SEED_SLUGS && covered(PROTOTYPE_SEED_SLUGS[r.slug])))
    .map(toLinzzyProduct);
  const missing = CATALOGUE.filter((c) => !live.some((p) => p.slug === c.slug));
  if (!missing.length) return live;
  const fromCatalogue = CATALOGUE.map((c) => live.find((p) => p.slug === c.slug) ?? c);
  return [...fromCatalogue, ...live.filter((p) => !CATALOGUE.some((c) => c.slug === p.slug))];
}

/** Every Linzzy product for the site, and whether the database could be read. */
export async function getLinzzyProducts(): Promise<{ products: LinzzyProduct[]; live: boolean }> {
  try {
    return { products: mergeLinzzyProducts(await getPublishedProducts(BRAND_SLUG)), live: true };
  } catch (error) {
    console.warn(`[products] showing the catalogue from content/catalogue.ts: ${error instanceof Error ? error.message : String(error)}`);
    return { products: CATALOGUE, live: false };
  }
}

/** The products of one range. */
export const inRange = (products: LinzzyProduct[], range: RangeSlug) => products.filter((p) => p.range === range);
