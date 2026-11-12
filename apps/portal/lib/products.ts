import "server-only";
import type { AppRole, Brand } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

export const PRODUCT_VIEW_ROLES: AppRole[] = ["admin", "management", "marketing"];
export const PRODUCT_EDIT_ROLES: AppRole[] = ["admin", "marketing"];

export type ProductAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  canEdit: boolean;
  /** Product brands this person works on (the corporate Lexta brand has no products). */
  brands: Pick<Brand, "id" | "slug" | "name">[];
};

/**
 * Who the signed in person is for product management, worked out on the server.
 * The database enforces the same rules with Row Level Security; this only shapes the screens.
 */
export async function getProductAccess(): Promise<ProductAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && PRODUCT_VIEW_ROLES.includes(role);
  const canEdit = !!role && PRODUCT_EDIT_ROLES.includes(role);
  if (!canView) return { userId: user.id, role, canView, canEdit: false, brands: [] };

  const supabase = await createClient();
  const limited = role !== "admin" && role !== "management";
  // Brands and this person's brand links in one round trip.
  const [brandsRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name").eq("is_active", true).eq("is_corporate", false).order("name"),
    limited ? supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (linksRes.error) throw new Error("Could not load brand access");

  let allowed = brandsRes.data ?? [];
  if (limited) {
    const ids = new Set(((linksRes.data ?? []) as { brand_id: string }[]).map((l) => l.brand_id));
    allowed = allowed.filter((b) => ids.has(b.id));
  }
  return { userId: user.id, role, canView, canEdit, brands: allowed };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}
