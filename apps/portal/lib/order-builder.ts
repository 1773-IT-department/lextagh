import "server-only";
import { productImageUrl } from "@lexta/db";
import type { BuilderProduct } from "@/components/orders/OrderBuilder";
import { brandName, type CatalogueProduct, type OrdersAccess } from "./orders";

/** Catalogue products in the shape the order builder takes. */
export function toBuilderProducts(access: OrdersAccess, products: CatalogueProduct[]): BuilderProduct[] {
  return products.map((p) => ({
    id: p.id,
    brandId: p.brand_id,
    brandName: brandName(access, p.brand_id),
    name: p.name,
    category: p.category,
    imageUrl: p.image ? productImageUrl(p.image) : null,
    skus: p.skus.map((s) => ({ id: s.id, code: s.sku_code, variant: s.variant_name, pack: s.pack_size_label })),
  }));
}
