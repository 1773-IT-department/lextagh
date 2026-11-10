import "server-only";
import type { AppRole, Brand, FieldVisitOutcome, Region } from "@lexta/db";
import { cleanSearch, UUID } from "./crm";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

/** Same as public.field_sales_role() in 0011_field_sales.sql. */
export const FIELD_SALES_ROLES: AppRole[] = ["admin", "management", "sales_rep"];
export const FIELD_BASE = "/systems/field-sales";

type BrandOption = Pick<Brand, "id" | "slug" | "name">;

export type FieldAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  /** Admin and management: every visit, the manager view, filters and export. */
  seesAll: boolean;
  isAdmin: boolean;
  /** Admin and sales reps may add a new shop (the Stockists rules of 0005 decide). */
  canAddShop: boolean;
  /** Product brands (never the corporate Lexta brand), for names and filters. */
  brands: BrandOption[];
  /** The brands this person works (all for admin and management). */
  myBrandIds: Set<string>;
  regions: Pick<Region, "id" | "name">[];
  /** Every outcome, active first by sort order (switched off ones are kept for names). */
  outcomes: FieldVisitOutcome[];
};

/**
 * Who the signed in person is for field sales, worked out on the server. The database enforces the same rules with
 * Row Level Security, column grants and triggers (0011_field_sales.sql); this only shapes the screens.
 */
export async function getFieldAccess(): Promise<FieldAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && FIELD_SALES_ROLES.includes(role);
  const seesAll = role === "admin" || role === "management";
  const base = { userId: user.id, role, canView, seesAll, isAdmin: role === "admin", canAddShop: role === "admin" || role === "sales_rep" };
  if (!canView) return { ...base, seesAll: false, isAdmin: false, canAddShop: false, brands: [], myBrandIds: new Set(), regions: [], outcomes: [] };

  const supabase = await createClient();
  const [brandsRes, regionsRes, outcomesRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name").eq("is_active", true).eq("is_corporate", false).order("name"),
    supabase.from("regions").select("id, name").order("sort_order").order("name"),
    supabase.from("field_visit_outcomes").select("id, slug, label, sort_order, is_active").order("sort_order").order("label"),
    seesAll ? Promise.resolve({ data: [], error: null }) : supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (regionsRes.error) throw new Error("Could not load regions");
  if (outcomesRes.error) throw new Error("Could not load visit outcomes");
  if (linksRes.error) throw new Error("Could not load brand access");
  const brands = (brandsRes.data ?? []) as BrandOption[];
  return {
    ...base,
    brands,
    myBrandIds: seesAll ? new Set(brands.map((b) => b.id)) : new Set(((linksRes.data ?? []) as { brand_id: string }[]).map((l) => l.brand_id)),
    regions: (regionsRes.data ?? []) as FieldAccess["regions"],
    outcomes: (outcomesRes.data ?? []) as FieldVisitOutcome[],
  };
}

export const NO_FIELD_ACCESS = "Your role does not include field sales. Ask your Lexta administrator if you need it.";

/** What the JSON routes answer, with status 401, when the session has ended (the phone asks the person to sign in). */
export const SESSION_ENDED = "Your session has ended, please sign in again.";

/**
 * For the JSON routes the phone calls (shops, visits, photos): the person's field sales access, or null when nobody is
 * signed in. Never redirects to the login page, so the phone gets an answer it can read.
 */
export async function fieldApiAccess(): Promise<FieldAccess | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getFieldAccess();
}

export const brandNames = (access: FieldAccess, ids: string[]) =>
  ids.map((id) => access.brands.find((b) => b.id === id)?.name).filter(Boolean).join(", ");

// Filters (manager view, history and CSV export share them) --------------------------------------------------

export type FieldFilters = { q: string; rep: string; region: string; brand: string; outcome: string; from: string; to: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v: string | undefined) => (v && DATE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : "");
const uuidOr = (v: string | undefined) => (v && UUID.test(v) ? v : "");

export function parseFieldFilters(params: Record<string, string | undefined>): FieldFilters {
  return {
    q: cleanSearch(params.q, 80),
    rep: uuidOr(params.rep),
    region: uuidOr(params.region),
    brand: uuidOr(params.brand),
    outcome: uuidOr(params.outcome),
    from: validDate(params.from),
    to: validDate(params.to),
  };
}

/** The arguments of public.field_visit_list. */
export function fieldFilterArgs(f: FieldFilters) {
  return {
    p_rep: f.rep || null,
    p_from: f.from || null,
    p_to: f.to || null,
    p_region: f.region || null,
    p_brand: f.brand || null,
    p_outcome: f.outcome || null,
    p_q: f.q || null,
  };
}

export function fieldFilterQuery(f: Partial<FieldFilters> & { page?: string }): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && !(k === "page" && v === "1")) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Active SKUs of published products of the person's brands, for the quick stock check. */
export type StockSku = { id: string; brandId: string; product: string; variant: string | null; pack: string; code: string };

export async function loadStockSkus(access: FieldAccess): Promise<StockSku[]> {
  const brandIds = [...access.myBrandIds];
  if (!brandIds.length) return [];
  const supabase = await createClient();
  const { data: products, error } = await supabase.from("products").select("id, brand_id, name, sort_order")
    .eq("is_published", true).in("brand_id", brandIds).order("sort_order").order("name");
  if (error) throw new Error("Could not load products");
  const ids = (products ?? []).map((p: { id: string }) => p.id);
  if (!ids.length) return [];
  const { data: skus, error: skuError } = await supabase.from("product_skus")
    .select("id, product_id, sku_code, variant_name, pack_size_label, sort_order")
    .eq("is_active", true).in("product_id", ids).order("sort_order").order("sku_code");
  if (skuError) throw new Error("Could not load products");
  type P = { id: string; brand_id: string; name: string };
  type S = { id: string; product_id: string; sku_code: string; variant_name: string | null; pack_size_label: string };
  const out: StockSku[] = [];
  for (const p of (products ?? []) as P[]) {
    for (const s of ((skus ?? []) as S[]).filter((k) => k.product_id === p.id)) {
      out.push({ id: s.id, brandId: p.brand_id, product: p.name, variant: s.variant_name, pack: s.pack_size_label, code: s.sku_code });
    }
  }
  return out;
}

/** Turns a database error from saving a visit into words a person can act on. Unknown errors are logged. */
export function fieldDbError(error: { code?: string; message?: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "42501") {
    if (msg.includes("shop not found")) return "That shop is not one of your brands' shops. Pick another one.";
    if (msg.includes("only field sales")) return "Your role does not include field sales.";
    if (msg.includes("check stock of brands")) return "You can only check stock of the brands you work on.";
    if (msg.includes("change this visit")) return "This visit can no longer be changed. Reps can change their visits for 24 hours.";
    if (msg.includes("row-level security") && msg.includes("stockist")) return "Your role cannot add new shops. Pick a listed shop.";
    return "You do not have permission to do this. Reload the page and try again.";
  }
  if (error.code === "23505") {
    if (msg.includes("stockists_unique_outlet")) return "That shop is already listed. Search for it by name instead of adding it.";
    return "This visit could not be saved. Reload the page and start again.";
  }
  if (error.code === "23514" || error.code === "22023" || error.code === "23502") {
    if (msg.includes("outcome")) return "Choose an outcome from the list.";
    if (msg.includes("brand for the new shop")) return "Choose at least one brand for the new shop.";
    if (msg.includes("choose a shop")) return "Choose a shop or add a new one.";
    if (msg.includes("not available for a stock check")) return "A product in the stock check is no longer available. Reload the page.";
    if (msg.includes("facings")) return "A product that is not on the shelf has no facings.";
    if (msg.includes("location")) return "The location could not be read. Try capturing it again.";
    if (msg.includes("at most 10 photos")) return "A visit has at most 10 photos.";
    if (msg.includes("missing or different")) return "The photo could not be checked. Please take it again.";
    return "Some details are missing or in the wrong format. Please check and try again.";
  }
  if (error.code === "22P02") return "One of the fields is in the wrong format.";
  if (error.code === "23503") return "Something you picked no longer exists. Reload the page and try again.";
  console.error(`[field-sales] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}
