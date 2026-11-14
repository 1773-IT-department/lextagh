/**
 * Hooch products, read live from Product Management ("edit once, every site updates").
 *
 * The same read the Lexta site's Our Brands page and the Yazz and Linzzy sites use: getPublishedProducts("hooch") in
 * packages/db, which joins the brands table by slug, uses the publishable key (Row Level Security only returns published
 * products of active brands) and caches under the "products" tag for up to an hour. The portal calls this site's
 * /api/revalidate after every product save, which clears the tag and rebuilds the product pages.
 *
 * The same merge rules as the Linzzy site (reviewed there): before migration 0017 the database still holds the
 * prototype rows (0004) with invented claims ("sun ripened", "low in fat") and photos hotlinked from a third-party shop,
 * so Lexta's Drive catalogue (content/catalogue.ts) supplies the wording and any missing cereal; after 0017 Product
 * Management alone decides what shows and how it reads (an unpublished cereal disappears, a staff edit shows).
 * If the database cannot be reached, the catalogue is shown and a warning is logged, so pages never break.
 */
import { getPublishedProducts, type PublishedProduct } from "@lexta/db";
import { CATALOGUE } from "../content/catalogue";

export const BRAND_SLUG = "hooch";

export type Flavour = "classic" | "frosted";

export type HoochProduct = {
  slug: string;
  name: string;
  category: string | null;
  short: string;
  long: string;
  features: string[];
  usage: string | null;
  ingredients: string | null;
  skus: { code: string; variant: string | null; pack: string }[];
  images: { src: string; alt: string }[];
  /** Which 3D box and colours the product gets. A product staff add later gets the classic (Cornflakes) look. */
  flavour: Flavour;
  /** Lexta's product page extras (content/catalogue.ts); a database row with the same slug borrows them. */
  tagline?: string;
  portions?: string;
  /** Recipe slugs (content/recipes.ts) that use the cereal. */
  recipes?: string[];
};

/**
 * Hosts whose pictures the site never shows: Lexta's real domains and their subdomains, and the third-party shop the
 * prototype seed (0004) hotlinked Hooch photos from (no rights to them, and they can change or vanish at any time).
 */
const BLOCKED_IMAGE_HOSTS = ["lextagh.com", "yazzproducts.com", "linzzyproducts.com", "hoochfoods.com", "chopboxonline.com"];

/** True when an image address points at a blocked host or a subdomain of one (www, cdn, shop...). */
export function isBlockedImage(src: string): boolean {
  try {
    const host = new URL(src, "https://local.invalid").hostname.toLowerCase().replace(/\.+$/, "");
    return BLOCKED_IMAGE_HOSTS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

/**
 * The Hooch rows seeded from the Lexta prototype (0004) that have no product in Lexta's Drive catalogue. "Super Crunchy
 * Corn Flakes" stands for Lexta's Hooch® Cornflakes; "Choco Flakes" is in no Lexta document (to be confirmed, see
 * CONTENT-NEEDED.md). While the database is in its prototype state the site skips them; migration 0017, when Desmond
 * applies it, unpublishes them. The third seed row, "frosted-flakes", has the catalogue's slug, so it is merged instead.
 */
export const PROTOTYPE_SEED_SLUGS = ["super-crunchy-corn-flakes", "choco-flakes"];
const PROTOTYPE_CORNFLAKES = "super-crunchy-corn-flakes";

/**
 * True while the database is still in its prototype state, before migration 0017: the prototype "Super Crunchy Corn
 * Flakes" row (which 0017 unpublishes) is published and Lexta's Cornflakes row (which 0017 writes) is not. Only those
 * two rows decide, so after 0017 staff can republish Choco Flakes, or unpublish Cornflakes, without the site ever
 * falling back to the catalogue.
 */
export function isPrototypeDatabase(rows: PublishedProduct[]): boolean {
  return rows.some((r) => r.slug === PROTOTYPE_CORNFLAKES) && !rows.some((r) => r.slug === "cornflakes");
}

const flavourOf = (slug: string, name: string): Flavour => (/frost/i.test(`${slug} ${name}`) ? "frosted" : "classic");

/**
 * One database row as a site product. After 0017 the database wins for everything it holds; a row with a catalogue
 * slug only borrows the extras (tagline, portions, flavour, recipes) and the catalogue picture when it has no usable
 * one. Before 0017 a row with a catalogue slug shows the Drive wording; its SKUs, photos and order come from the database.
 */
export function toHoochProduct(p: PublishedProduct, prototype = false): HoochProduct {
  const images = p.images.filter((i) => !isBlockedImage(i.url)).map((i) => ({ src: i.url, alt: i.alt_text }));
  const base: HoochProduct = {
    slug: p.slug,
    name: p.name,
    category: p.category,
    short: p.short_description ?? p.long_description ?? "",
    long: p.long_description ?? p.short_description ?? "",
    features: p.key_features ?? [],
    usage: p.usage_instructions,
    ingredients: p.ingredients,
    skus: p.skus.map((s) => ({ code: s.sku_code, variant: s.variant_name, pack: s.pack_size_label })),
    images,
    flavour: flavourOf(p.slug, p.name),
  };
  const c = CATALOGUE.find((x) => x.slug === p.slug);
  if (!c) return base;
  if (!prototype) {
    return { ...base, images: images.length ? images : c.images, flavour: c.flavour, tagline: c.tagline, portions: c.portions, recipes: c.recipes };
  }
  return {
    ...c,
    category: base.category ?? c.category,
    skus: base.skus.length && !base.skus.some((s) => s.pack.includes("PLACEHOLDER")) ? base.skus : c.skus,
    images: images.length ? images : c.images,
  };
}

/**
 * The site's product list. After 0017: exactly the published rows, in Product Management's order (a prototype row
 * staff republish shows too: Product Management decides). Before 0017: prototype rows skipped, rows merged with the catalogue, every
 * catalogue cereal the database lacks added, in the catalogue's order, then any product staff added.
 */
export function mergeHoochProducts(rows: PublishedProduct[]): HoochProduct[] {
  const prototype = isPrototypeDatabase(rows);
  if (!prototype) return rows.map((r) => toHoochProduct(r, false));
  const live = rows.filter((r) => !PROTOTYPE_SEED_SLUGS.includes(r.slug)).map((r) => toHoochProduct(r, true));
  const fromCatalogue = CATALOGUE.map((c) => live.find((p) => p.slug === c.slug) ?? c);
  return [...fromCatalogue, ...live.filter((p) => !CATALOGUE.some((c) => c.slug === p.slug))];
}

/** Every Hooch product for the site, and whether the database could be read. */
export async function getHoochProducts(): Promise<{ products: HoochProduct[]; live: boolean }> {
  try {
    return { products: mergeHoochProducts(await getPublishedProducts(BRAND_SLUG)), live: true };
  } catch (error) {
    console.warn(`[products] showing the catalogue from content/catalogue.ts: ${error instanceof Error ? error.message : String(error)}`);
    return { products: CATALOGUE, live: false };
  }
}
