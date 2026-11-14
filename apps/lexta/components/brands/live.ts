/**
 * Our Brands product cards, read live from Product Management ("edit once, the website updates").
 *
 * Products come from getPublishedProducts in @lexta/db (publishable key, so Row Level Security only returns
 * published products of active brands). Its requests are cached under the "products" tag for up to an hour;
 * the portal calls /api/revalidate after every product save, which clears the tag and rebuilds /our-brands.
 * If the database cannot be reached, or the site has no Supabase settings, a brand falls back to the approved
 * static cards in ./data.ts and a warning is logged, so the page never breaks.
 */
import { getPublishedProducts, isBrandSiteImage, type PublishedProduct } from "@lexta/db";
import { hoochProducts, linzzyProducts, yazzProducts, type ProductCard, type ProductImage, type ProductMedia } from "./data";

export const BRAND_SLUGS = ["yazz", "linzzy", "hooch"] as const;
export type BrandSlug = (typeof BRAND_SLUGS)[number];

/** The approved prototype cards: the fallback, and layout hints for the seeded products. */
export const staticRanges: Record<BrandSlug, ProductCard[]> = { yazz: yazzProducts, linzzy: linzzyProducts, hooch: hoochProducts };

/** A card box holds at most three pack shots side by side (as the prototype's widest card does). */
const MAX_GRID_IMAGES = 3;

const isLocal = (src: string | undefined) => !!src && src.startsWith("/");

/** Prototype media kept only when it is a local pack shot (the database has no image for the product yet). */
function localMedia(hint: ProductCard | undefined): ProductMedia | undefined {
  const m = hint?.media;
  if (!m) return undefined;
  if (m.kind === "photo" && isLocal(m.src)) return m;
  if (m.kind === "single" && isLocal(m.image.src)) return m;
  return undefined;
}

/** Turns one published product into the card the page already draws. */
export function toProductCard(product: PublishedProduct, hint?: ProductCard): ProductCard {
  // A path such as /images/original/pad-heavy-flow.webp (0016) is a file of the brand's own website, not of this site:
  // it is left out, so the card falls back to the prototype's local pack shot or the styled placeholder.
  let images: ProductImage[] = product.images.filter((i) => !isBrandSiteImage(i)).map((i) => ({ src: i.url, alt: i.alt_text }));

  // Before/after strip (Yazz washing powder): kept while the product still has those two exact images.
  let beforeAfter: ProductCard["beforeAfter"];
  if (hint?.beforeAfter) {
    const before = images.find((i) => i.src === hint.beforeAfter!.before.src);
    const after = images.find((i) => i.src === hint.beforeAfter!.after.src);
    if (before && after) {
      beforeAfter = { before, after };
      images = images.filter((i) => i !== before && i !== after);
    }
  }

  let media: ProductMedia;
  if (images.length === 0) {
    media = localMedia(hint) ?? { kind: "photo", placeholder: `${product.name} pack shot`, alt: "", w: 1080, h: 1080 };
  } else if (images.length === 1) {
    // Keep the prototype's one-off size for an image only while it is the same picture.
    const same = hint?.media.kind === "single" && hint.media.image.src === images[0].src ? hint.media : undefined;
    media = { kind: "single", image: images[0], imgStyle: same?.imgStyle, imgSize: same?.imgSize };
  } else {
    const shown = images.slice(0, MAX_GRID_IMAGES);
    media = { kind: "grid", columns: shown.length === 2 ? 2 : 3, images: shown };
  }

  return {
    slug: product.slug,
    name: product.name,
    description: product.long_description ?? product.short_description ?? "",
    media,
    beforeAfter,
  };
}

/**
 * The cards of every brand, in Product Management's display order.
 * Each brand falls back to its static cards on its own if its products cannot be loaded.
 */
export async function getBrandRanges(): Promise<Record<BrandSlug, ProductCard[]>> {
  const results = await Promise.allSettled(BRAND_SLUGS.map((slug) => getPublishedProducts(slug)));
  const ranges = {} as Record<BrandSlug, ProductCard[]>;
  BRAND_SLUGS.forEach((slug, k) => {
    const r = results[k];
    if (r.status === "fulfilled") {
      const hints = new Map(staticRanges[slug].map((c) => [c.slug, c]));
      ranges[slug] = r.value.map((p) => toProductCard(p, hints.get(p.slug)));
    } else {
      console.warn(`[our-brands] showing the static ${slug} cards: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
      ranges[slug] = staticRanges[slug];
    }
  });
  return ranges;
}
