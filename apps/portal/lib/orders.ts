import "server-only";
import type { AppRole, Brand, DistributorAccount, Region } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

/** Who works distributor orders. Same as public.order_staff_role() in 0010_distributor_orders.sql. */
export const ORDER_STAFF_ROLES: AppRole[] = ["admin", "management", "sales_rep"];

export const ORDERS_BASE = "/systems/orders";

type BrandOption = Pick<Brand, "id" | "slug" | "name">;

export type OrdersAccess = {
  userId: string;
  role: AppRole | null;
  /** An active distributor login (linked or not). */
  isDistributor: boolean;
  /** Admin, management and sales reps: the orders inbox. */
  isStaff: boolean;
  isAdmin: boolean;
  /** The distributor's organisation and its brands; null when the login is not linked yet. */
  account: DistributorAccount | null;
  /** Product brands (never the corporate Lexta brand), for names and the brand filter. */
  brands: BrandOption[];
  /** Staff: the brands this person works (all for admin and management). */
  myBrandIds: Set<string>;
  regions: Pick<Region, "id" | "name">[];
};

/**
 * Who the signed in person is for ordering, worked out on the server. The database enforces the same rules with Row
 * Level Security, column grants and triggers; this only shapes the screens.
 */
export async function getOrdersAccess(): Promise<OrdersAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const isDistributor = role === "distributor";
  const isStaff = !!role && ORDER_STAFF_ROLES.includes(role);
  const base = { userId: user.id, role, isDistributor, isStaff, isAdmin: role === "admin" };
  const empty = { ...base, account: null, brands: [], myBrandIds: new Set<string>(), regions: [] };
  if (!isDistributor && !isStaff) return empty;

  const supabase = await createClient();
  const sees = role === "admin" || role === "management";
  const [brandsRes, regionsRes, accountRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name").eq("is_active", true).eq("is_corporate", false).order("name"),
    supabase.from("regions").select("id, name").order("sort_order").order("name"),
    isDistributor ? supabase.rpc("my_distributor_account") : Promise.resolve({ data: null, error: null }),
    isStaff && !sees ? supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (regionsRes.error) throw new Error("Could not load regions");
  if (accountRes.error) throw new Error("Could not load your distributor account");
  if (linksRes.error) throw new Error("Could not load brand access");
  const brands = (brandsRes.data ?? []) as BrandOption[];
  return {
    ...base,
    account: (accountRes.data as DistributorAccount | null) ?? null,
    brands,
    myBrandIds: sees ? new Set(brands.map((b) => b.id)) : new Set(((linksRes.data ?? []) as { brand_id: string }[]).map((l) => l.brand_id)),
    regions: (regionsRes.data ?? []) as OrdersAccess["regions"],
  };
}

export const NO_ORDERS_ACCESS = "Your role does not include distributor ordering. Ask your Lexta administrator if you need it.";
export const NOT_LINKED =
  "Your login is not linked to a distributor account yet. Ask your Lexta sales contact to link it, then sign in again.";

export const brandName = (access: OrdersAccess, id: string) => access.brands.find((b) => b.id === id)?.name ?? "Brand";
export const regionName = (access: OrdersAccess, id: string | null | undefined) =>
  (id ? access.regions.find((r) => r.id === id)?.name : "") ?? "";

/** Prices are not in the product data; this is what screens show instead. */
export const PRICE_PLACEHOLDER = "[PLACEHOLDER: pricing and invoicing come later, from Lexta's sales team or ERP]";
/** Email is not set up yet. */
export const NOTIFY_PLACEHOLDER = "[PLACEHOLDER: email Lexta sales when an order is submitted, once email is set up]";

/** One catalogue product with its active SKUs, for the distributor. */
export type CatalogueProduct = {
  id: string;
  brand_id: string;
  name: string;
  category: string | null;
  short_description: string | null;
  image: { storage_path: string | null; external_url: string | null; alt_text: string } | null;
  skus: { id: string; sku_code: string; variant_name: string | null; pack_size_label: string }[];
};

/**
 * Published products of the brands the distributor's organisation carries, with active SKUs and the main image.
 * Row Level Security already limits products to published ones; the brand list limits it to the organisation.
 */
export async function loadCatalogue(account: DistributorAccount): Promise<CatalogueProduct[]> {
  const brandIds = account.brands.map((b) => b.id);
  if (!brandIds.length) return [];
  const supabase = await createClient();
  const { data: products, error } = await supabase.from("products")
    .select("id, brand_id, name, category, short_description, sort_order")
    .eq("is_published", true).in("brand_id", brandIds).order("sort_order").order("name");
  if (error) throw new Error("Could not load the catalogue");
  const ids = (products ?? []).map((p: { id: string }) => p.id);
  if (!ids.length) return [];
  const [skusRes, imagesRes] = await Promise.all([
    supabase.from("product_skus").select("id, product_id, sku_code, variant_name, pack_size_label, sort_order")
      .eq("is_active", true).in("product_id", ids).order("sort_order").order("sku_code"),
    supabase.from("product_images").select("product_id, storage_path, external_url, alt_text, is_primary, sort_order")
      .in("product_id", ids).order("sort_order"),
  ]);
  if (skusRes.error) throw new Error("Could not load the catalogue");
  type Sku = CatalogueProduct["skus"][number] & { product_id: string };
  type Img = NonNullable<CatalogueProduct["image"]> & { product_id: string; is_primary: boolean };
  const skus = (skusRes.data ?? []) as Sku[];
  const images = (imagesRes.error ? [] : imagesRes.data ?? []) as Img[];
  return (products as Omit<CatalogueProduct, "image" | "skus">[])
    .map((p) => {
      const imgs = images.filter((i) => i.product_id === p.id);
      const img = imgs.find((i) => i.is_primary) ?? imgs[0] ?? null;
      return {
        id: p.id, brand_id: p.brand_id, name: p.name, category: p.category, short_description: p.short_description,
        image: img ? { storage_path: img.storage_path, external_url: img.external_url, alt_text: img.alt_text } : null,
        skus: skus.filter((s) => s.product_id === p.id).map(({ id, sku_code, variant_name, pack_size_label }) => ({ id, sku_code, variant_name, pack_size_label })),
      };
    })
    .filter((p) => p.skus.length > 0);
}

/** Names for history and notes (staff only; empty for everyone else). */
export async function loadOrderPeople(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("distributor_order_people");
  if (error) return new Map();
  return new Map(((data ?? []) as { id: string; display_name: string }[]).map((p) => [p.id, p.display_name]));
}
