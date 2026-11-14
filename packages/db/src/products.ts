import type { SupabaseClient } from "@supabase/supabase-js";
import { createWebsiteReadClient, websiteReadDeadline } from "./client";
import type { Product, ProductImage, ProductSku } from "./types";

/** Storage bucket for uploaded product photos. Paths are <brand_slug>/<product_id>/<file name>. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Cache tag the websites use for product data; the revalidate route clears it. */
export const PRODUCTS_CACHE_TAG = "products";

export type PublishedProduct = Product & {
  skus: ProductSku[];
  images: (ProductImage & { url: string })[];
};

/**
 * Photos the prototype seed (0004) linked from Lexta's old websites and a retailer. Each one is now a shared photo file
 * (/images/yazz/... or /images/linzzy/..., shipped in the Lexta site, the portal and the Yazz site), so no page depends on the old sites
 * staying online. A row whose link is listed here is shown from the local copy; any other link is used as it is.
 */
export const LEGACY_IMAGE_COPIES: Readonly<Record<string, string>> = {
  "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/7018.png": "/images/yazz/baby-diapers-large.webp",
  "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/70195_1_1.jpg": "/images/yazz/baby-wipes-pack.webp",
  "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-green.jpg": "/images/yazz/baby-wipes-green.webp",
  "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-yellow.jpg": "/images/yazz/baby-wipes-yellow.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/07/Mama-Yazz-Kitchen-Towel2.png": "/images/yazz/mama-yazz-kitchen-towel.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/07/Yazz-sanitary-pad-Extra-Long.png": "/images/yazz/sanitary-pad-extra-long-pack.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/07/unnamed-1.png": "/images/yazz/tissue-range.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-charcoal-Toothpaste-e1787744429757.jpg": "/images/yazz/toothpaste-charcoal-new.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-herbal-Toothpaste-e1787744479191.jpg": "/images/yazz/toothpaste-herbal-new.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-Flouride-Toothpaste-e1787744539801.jpg": "/images/yazz/toothpaste-fluoride-new.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/06/clean-yazz-cloth.png": "/images/yazz/washing-clean-cloth.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/06/dirty-yazz-cloth.png": "/images/yazz/washing-dirty-cloth.webp",
  "https://yazzproducts.com/wp-content/uploads/2026/07/EDSfdc2W4AAu3PT.jpg": "/images/yazz/washing-powder-pack.webp",
  "https://lextagh.com/wp-content/uploads/2026/06/Yazz-Washing-powder1.jpg": "/images/yazz/washing-powder-banner.webp",
  // Unpublished prototype Linzzy rows (0016), still listed in the portal.
  "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Your-trusted-partner-copy.jpg.jpeg": "/images/linzzy/prototype-trusted-partner.webp",
  "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Baby-Diaper-copy.jpg-1.jpeg": "/images/linzzy/prototype-baby-diaper.webp",
};

/** Public address of a product image, whether it was uploaded or is an outside link. */
export function productImageUrl(image: Pick<ProductImage, "storage_path" | "external_url">): string {
  if (image.external_url) return LEGACY_IMAGE_COPIES[image.external_url] ?? image.external_url;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const path = (image.storage_path ?? "").split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

/**
 * A product photo every app ships in its own public folder at the same path, /images/<brand>/<file> (0016), for example
 * /images/linzzy/pad-heavy-flow.webp: the Lexta site, the portal and the brand website all serve it, so all show it.
 */
export const SHARED_IMAGE_PATH = /^\/images\/(yazz|linzzy|hooch)\/[A-Za-z0-9._-]+$/;

/** True for an image address that is one of the shared photo files (see SHARED_IMAGE_PATH). */
export function isSharedImagePath(url: string | null | undefined): boolean {
  return !!url && SHARED_IMAGE_PATH.test(url) && !url.includes("..");
}

/**
 * True for any other site path, such as /images/original/x.webp: a file only one brand website ships in its public
 * folder. Only that website can show it; the Lexta site and the portal treat it as no picture.
 */
export function isBrandSiteImage(image: Pick<ProductImage, "storage_path" | "external_url">): boolean {
  return !image.storage_path && !!image.external_url?.startsWith("/") && !isSharedImagePath(image.external_url);
}

/** Address of a product image that any app can show (shared photo files included), or null for a brand website's own file. */
export function sharedProductImageUrl(image: Pick<ProductImage, "storage_path" | "external_url">): string | null {
  return isBrandSiteImage(image) ? null : productImageUrl(image);
}

/**
 * Published products of one brand with their active SKUs and images, in display order.
 * For the websites: uses the publishable key, so Row Level Security only ever returns published data.
 * Requests are cached under the "products" tag, so a portal save refreshes the pages.
 * Gives up after WEBSITE_READ_TIMEOUT_MS (one attempt, no retries) so a site can fall back instead of waiting.
 */
export async function getPublishedProducts(brandSlug: string, client?: SupabaseClient): Promise<PublishedProduct[]> {
  const supabase = client ?? createWebsiteReadClient(PRODUCTS_CACHE_TAG);
  const { data, error } = await supabase
    .from("products")
    .select("*, brand:brands!inner(slug), skus:product_skus(*), images:product_images(*)")
    .eq("brand.slug", brandSlug)
    .eq("is_published", true)
    .order("sort_order")
    .order("name")
    .abortSignal(websiteReadDeadline());
  if (error) throw new Error(`Could not load products for ${brandSlug}: ${error.message}`);

  type Row = Product & { brand: unknown; skus: ProductSku[] | null; images: ProductImage[] | null };
  return ((data ?? []) as Row[]).map(({ brand: _brand, skus, images, ...product }) => ({
    ...product,
    skus: (skus ?? []).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order),
    images: (images ?? [])
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((i) => ({ ...i, url: productImageUrl(i) })),
  }));
}
