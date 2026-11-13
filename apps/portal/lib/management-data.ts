import "server-only";
import type { Dashboard } from "@/lib/dashboard";
import { isManager, parseManagementFilters, previousPeriod, type ManagementFilters, type Timeseries } from "@/lib/management";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { BrandOption } from "@/components/management/ManagementHeader";

type Search = Partial<Record<string, string>>;

export type ManagementContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  f: ManagementFilters;
  brands: BrandOption[];
  brandName: (id: string) => string;
  /** Every brand's name by id, the corporate brand included (for brand labels on records). */
  brandNames: Record<string, string>;
  prev: { from: string; to: string; days: number };
};

/**
 * Who may open the overview (checked on the server; the database checks again) and the filters from the address.
 * Null for any other role: the page then says so and loads nothing.
 */
export async function managementContext(params: Search): Promise<ManagementContext | null> {
  const { profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  if (!isManager(role)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("id, name, is_active, is_corporate").order("name");
  const all = (data ?? []) as (BrandOption & { is_corporate: boolean })[];
  // Product brands only in the filter: the corporate Lexta brand is left out (every brand still counts it).
  const brands = all.filter((b) => !b.is_corporate).map(({ id, name, is_active }) => ({ id, name, is_active }));
  const f = parseManagementFilters(params, brands.map((b) => b.id));
  const names = new Map(all.map((b) => [b.id, b.name]));
  return { supabase, f, brands, brandName: (id) => names.get(id) ?? "", brandNames: Object.fromEntries(names), prev: previousPeriod(f.from, f.to) };
}

/** The dashboard numbers for the period and for the previous period of the same length, in parallel. */
export async function loadNumbers(ctx: ManagementContext): Promise<{ now: Dashboard; before: Dashboard } | null> {
  const { supabase, f, prev } = ctx;
  const brand = f.brand || null;
  const [a, b] = await Promise.all([
    supabase.rpc("management_dashboard", { p_from: f.from, p_to: f.to, p_brand: brand }),
    supabase.rpc("management_dashboard", { p_from: prev.from, p_to: prev.to, p_brand: brand }),
  ]);
  if (a.error || b.error) {
    console.error("[management] numbers failed", a.error ?? b.error);
    return null;
  }
  return { now: a.data as Dashboard, before: b.data as Dashboard };
}

export async function loadSeries(ctx: ManagementContext): Promise<Timeseries | null> {
  const { supabase, f } = ctx;
  const { data, error } = await supabase.rpc("management_timeseries", { p_from: f.from, p_to: f.to, p_brand: f.brand || null });
  if (error) {
    console.error("[management] charts failed", error);
    return null;
  }
  return data as Timeseries;
}
