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

/** Public address of a product image, whether it was uploaded or is an outside link. */
export function productImageUrl(image: Pick<ProductImage, "storage_path" | "external_url">): string {
  if (image.external_url) return image.external_url;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const path = (image.storage_path ?? "").split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

/**
 * True for a path such as /images/original/pad-heavy-flow.webp (allowed since 0016): a file the brand's own website
 * ships in its public folder. Only that website can show it; the Lexta site and the portal treat it as no picture.
 */
export function isBrandSiteImage(image: Pick<ProductImage, "storage_path" | "external_url">): boolean {
  return !image.storage_path && !!image.external_url?.startsWith("/");
}

/** Address of a product image that any app can show, or null for a brand website's own file (see isBrandSiteImage). */
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
