import "server-only";
import type { ProductOption, SkuOption } from "@/components/complaints/ComplaintForm";
import { createClient } from "./supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Products and pack sizes this person can see (Row Level Security decides), for the complaint form pickers. */
export async function productPickers(supabase: Client): Promise<{ products: ProductOption[]; skus: SkuOption[] }> {
  const [productsRes, skusRes] = await Promise.all([
    supabase.from("products").select("id, name, brand_id").order("sort_order").order("name").limit(1000),
    supabase.from("product_skus").select("id, product_id, sku_code, variant_name, pack_size_label").eq("is_active", true)
      .order("sort_order").order("sku_code").limit(3000),
  ]);
  if (productsRes.error) throw new Error("Could not load products");
  if (skusRes.error) throw new Error("Could not load pack sizes");
  const products = (productsRes.data ?? []).map((p) => ({ id: p.id as string, label: p.name as string, brand_id: p.brand_id as string }));
  const skus = (skusRes.data ?? []).map((s) => ({
    id: s.id as string,
    product_id: s.product_id as string,
    label: [s.variant_name, s.pack_size_label, `(${s.sku_code})`].filter(Boolean).join(" "),
  }));
  return { products, skus };
}
