import "server-only";
import type { AppRole, Brand, Region } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

export const STOCKIST_VIEW_ROLES: AppRole[] = ["admin", "management", "sales_rep", "marketing", "customer_care"];
export const STOCKIST_EDIT_ROLES: AppRole[] = ["admin", "sales_rep", "marketing"];

type BrandOption = Pick<Brand, "id" | "slug" | "name">;

export type StockistAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  /** May create stockists and link their own brands (admin, sales_rep, marketing). */
  canCreate: boolean;
  /** Every product brand, for filters and showing what a stockist carries. */
  allBrands: BrandOption[];
  /** The product brands this person may add to or remove from a stockist. */
  myBrands: BrandOption[];
  regions: Pick<Region, "id" | "slug" | "name" | "is_in_ghana">[];
};

/**
 * Who the signed in person is for stockists, worked out on the server.
 * The database enforces the same rules with Row Level Security; this only shapes the screens.
 */
export async function getStockistAccess(): Promise<StockistAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && STOCKIST_VIEW_ROLES.includes(role);
  const canCreate = !!role && STOCKIST_EDIT_ROLES.includes(role);
  const base = { userId: user.id, role, canView, canCreate };
  if (!canView) return { ...base, canCreate: false, allBrands: [], myBrands: [], regions: [] };

  const supabase = await createClient();
  const linked = canCreate && role !== "admin";
  // Brands, regions and this person's brand links in one round trip.
  const [brandsRes, regionsRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name").eq("is_active", true).eq("is_corporate", false).order("name"),
    supabase.from("regions").select("id, slug, name, is_in_ghana").order("sort_order").order("name"),
    linked ? supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (regionsRes.error) throw new Error("Could not load regions");
  if (linksRes.error) throw new Error("Could not load brand access");
  const allBrands = (brandsRes.data ?? []) as BrandOption[];

  let myBrands: BrandOption[] = [];
  if (role === "admin") myBrands = allBrands;
  else if (linked) {
    const ids = new Set(((linksRes.data ?? []) as { brand_id: string }[]).map((l) => l.brand_id));
    myBrands = allBrands.filter((b) => ids.has(b.id));
  }
  return { ...base, allBrands, myBrands, regions: (regionsRes.data ?? []) as StockistAccess["regions"] };
}

/**
 * Same rule as public.can_edit_stockist in 0005_stockists.sql, for showing the right buttons in lists.
 * The database still decides on every write.
 */
export function canEditStockist(access: StockistAccess, stockist: { created_by: string | null; brandIds: string[] }): boolean {
  if (!access.canCreate) return false;
  if (access.role === "admin") return true;
  if (stockist.brandIds.length === 0) return stockist.created_by === access.userId;
  const mine = new Set(access.myBrands.map((b) => b.id));
  return stockist.brandIds.every((id) => mine.has(id));
}
